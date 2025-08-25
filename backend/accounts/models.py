from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import UniqueConstraint, Index
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in


# ----------------------------
# Référentiels & RBAC
# ----------------------------

class Role(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)      # ex: marketing, dsi, finance, dg, admin
    nom  = models.CharField(max_length=150)

    class Meta:
        db_table = "roles"
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"
        ordering = ("code",)

    def __str__(self) -> str:
        return f"{self.code} — {self.nom}"


class Permission(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=100, unique=True)     # ex: projets:creer, etudes:valider
    description = models.CharField(max_length=255)

    class Meta:
        db_table = "permissions"
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"
        ordering = ("code",)

    def __str__(self) -> str:
        return self.code


class Service(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)      # ex: marketing, dsi, dem, finance
    nom  = models.CharField(max_length=150)

    class Meta:
        db_table = "services"
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ("code",)

    def __str__(self) -> str:
        return f"{self.code} — {self.nom}"


class RolePermission(models.Model):
    """
    Table de jointure N↔N entre Role et Permission.
    PK composite côté SQL -> on le reflète par une unique_together.
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, db_column="role_id")
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, db_column="permission_id")

    class Meta:
        db_table = "role_permissions"
        constraints = [
            UniqueConstraint(fields=("role", "permission"), name="uq_role_permissions_role_perm"),
        ]
        indexes = [
            Index(fields=("role",)),
            Index(fields=("permission",)),
        ]
        verbose_name = "Droit d’un rôle"
        verbose_name_plural = "Droits des rôles"

    def __str__(self) -> str:
        return f"{self.role.code} → {self.permission.code}"


# ----------------------------
# Utilisateurs
# ----------------------------

class User(AbstractUser):
    """
    Mappe la table `utilisateurs` de ton SQL :
      - username    VARCHAR(150) UNIQUE (hérité)
      - email       VARCHAR(254) UNIQUE
      - prenom      VARCHAR(100)
      - nom         VARCHAR(100)
      - role_id     BIGINT (FK → roles.id)         (optionnel)
      - service_id  BIGINT (FK → services.id)      (optionnel)
      - phone       VARCHAR(30)                     (optionnel)
      - derniere_connexion_le DATETIME NULL
      - cree_le           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      - mis_a_jour_le     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    """
    email  = models.EmailField(max_length=254, unique=True)
    prenom = models.CharField(max_length=100)
    nom    = models.CharField(max_length=100)
    phone  = models.CharField(max_length=30, null=True, blank=True)
    photo_url = models.CharField(max_length=250, null=True, blank=True, verbose_name="URL de la photo de profil")

    role    = models.ForeignKey(Role, null=True, blank=True, on_delete=models.SET_NULL, db_column="role_id")
    service = models.ForeignKey(Service, null=True, blank=True, on_delete=models.SET_NULL, db_column="service_id")

    # Champs métier supplémentaires
    derniere_connexion_le = models.DateTimeField(null=True, blank=True)  # miroir dédié (en plus de last_login)
    cree_le        = models.DateTimeField(auto_now_add=True)
    mis_a_jour_le  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "utilisateurs"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        indexes = [
            Index(fields=("username",)),
            Index(fields=("email",)),
            Index(fields=("role",)),
            Index(fields=("service",)),
        ]
        constraints = [
            UniqueConstraint(fields=("username",), name="uq_utilisateurs_username"),
            UniqueConstraint(fields=("email",), name="uq_utilisateurs_email"),
        ]

    def save(self, *args, **kwargs):
        # Garder l’admin Django cohérent avec tes champs métier
        self.first_name = self.prenom
        self.last_name  = self.nom
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.username or self.email

    # --------- aide RBAC côté API ----------
    @property
    def permissions_codes(self) -> list[str]:
        """
        Liste triée et unique des codes permissions liés au rôle de l'utilisateur.
        Équivalent programmatique de ta vue `vue_contexte_utilisateur`.
        """
        if not self.role_id:
            return []
        return list(
            Permission.objects.filter(rolepermission__role_id=self.role_id)
            .order_by("code")
            .values_list("code", flat=True)
            .distinct()
        )


# Synchroniser `derniere_connexion_le` lors des connexions (en plus de last_login géré par Django)
@receiver(user_logged_in)
def _update_derniere_connexion(sender, user, request, **kwargs):
    try:
        User.objects.filter(pk=user.pk).update(derniere_connexion_le=models.functions.Now())
    except Exception:
        pass


# ----------------------------
# Tokens JWT invalidés (liste noire par jti)
# ----------------------------

class JwtJtiInvalide(models.Model):
    id = models.BigAutoField(primary_key=True)
    utilisateur = models.ForeignKey(User, on_delete=models.CASCADE, db_column="utilisateur_id")
    jti = models.CharField(max_length=255, unique=True)  # identifiant unique du token JWT
    invalide_le = models.DateTimeField(auto_now_add=True)
    raison = models.CharField(max_length=200, null=True, blank=True)

    class Meta:
        db_table = "jwt_jti_invalide"
        verbose_name = "JWT invalidé"
        verbose_name_plural = "JWT invalidés"
        indexes = [
            Index(fields=("utilisateur",)),
            Index(fields=("invalide_le",)),
        ]

    def __str__(self) -> str:
        return f"{self.jti} (user={self.utilisateur_id})"
