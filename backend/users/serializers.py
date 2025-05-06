# users/serializers.py
from rest_framework import serializers
from .models import Agent

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'brokerage']
