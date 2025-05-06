from django.apps import AppConfig


class UsersConfig(AppConfig):  # ✅ Rename to match new app
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'  # ✅ Match new app folder name
