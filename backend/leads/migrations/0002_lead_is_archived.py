# Generated by Django 5.2 on 2025-05-09 01:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="lead",
            name="is_archived",
            field=models.BooleanField(default=False),
        ),
    ]
