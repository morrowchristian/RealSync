# users/serializers.py
from rest_framework import serializers
from .models import Agent

class AgentSerializer(serializers.ModelSerializer):
    # Read-only trial info, computed from date_joined + TRIAL_DAYS.
    trial_ends_at = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()

    class Meta:
        model = Agent
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'company', 'is_trial', 'trial_ends_at', 'days_remaining']


class RegistrationSerializer(serializers.ModelSerializer):
    """Public signup. Only username/email/password are accepted — a
    client cannot set is_staff / is_superuser / is_trial itself."""
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(required=True)

    class Meta:
        model = Agent
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = Agent(
            username=validated_data['username'],
            email=validated_data['email'],
            is_trial=True,
        )
        user.set_password(validated_data['password'])
        user.save()
        return user
