import re

from rest_framework import serializers
from django.utils.text import slugify
from .models import CustomField, Lead, LeadFormSettings, merge_field_config

PHONE_RE = re.compile(r'^\+?[\d\s()\-]{7,20}$')


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = '__all__'
        # `agent` is set by the viewset from the logged-in user
        # (perform_create) — it must never be required in, or taken
        # from, the request payload. DRF validates the serializer
        # BEFORE perform_create runs, so a writable `agent` made every
        # create without an agent id fail with
        # "agent: This field is required."
        read_only_fields = ('agent',)

    def validate_phone(self, value):
        if value and not PHONE_RE.match(value):
            raise serializers.ValidationError(
                'Enter a valid phone number (digits, spaces, parentheses, dashes, '
                'and an optional leading + only).'
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user is None or not getattr(user, 'is_authenticated', False):
            return attrs

        # Required custom fields (this agent's ACTIVE ones only) must have
        # a non-empty value in custom_data. On update, merge the incoming
        # custom_data over the lead's existing values first.
        custom_data = dict(getattr(self.instance, 'custom_data', None) or {})
        if 'custom_data' in attrs and isinstance(attrs['custom_data'], dict):
            custom_data.update(attrs['custom_data'])

        errors = []
        for field in CustomField.objects.filter(agent=user, is_active=True, required=True):
            value = custom_data.get(field.name)
            if field.field_type == 'checkbox':
                if value is not True:
                    errors.append(f'{field.label} is required.')
            elif value is None or value == '' or value == []:
                errors.append(f'{field.label} is required.')
        if errors:
            raise serializers.ValidationError({'custom_data': errors})
        return attrs


class CustomFieldSerializer(serializers.ModelSerializer):
    # Optional on input: auto-generated from `label` via slugify when omitted.
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)

    class Meta:
        model = CustomField
        fields = '__all__'
        read_only_fields = ('agent',)

    def _unique_name(self, agent, label, exclude_pk=None):
        base = slugify(label) or 'field'
        name = base
        suffix = 2
        qs = CustomField.objects.filter(agent=agent, name=name)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)
        while qs.exists():
            name = f'{base}-{suffix}'
            suffix += 1
            qs = CustomField.objects.filter(agent=agent, name=name)
            if exclude_pk is not None:
                qs = qs.exclude(pk=exclude_pk)
        return name

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        agent = getattr(request, 'user', None)
        instance = getattr(self, 'instance', None)

        name = attrs.get('name')
        if not name:
            # Auto-generate from label (create, or update where the client
            # cleared the name). On update, keep the existing name when
            # the label is unchanged and no name was supplied.
            label = attrs.get('label') or (instance.label if instance else '')
            if instance is not None and label == instance.label:
                attrs['name'] = instance.name
            elif label:
                attrs['name'] = self._unique_name(agent, label, exclude_pk=instance.pk if instance else None)
        else:
            # Explicit name: must be unique per agent (excluding self).
            qs = CustomField.objects.filter(agent=agent, name=name)
            if instance is not None:
                qs = qs.exclude(pk=instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    {'name': 'A custom field with this name already exists.'}
                )
        return attrs


class LeadFormSettingsSerializer(serializers.ModelSerializer):
    # Read view: always the merged config (stored overlaid on defaults).
    field_config = serializers.SerializerMethodField()

    class Meta:
        model = LeadFormSettings
        fields = ('field_config',)

    def get_field_config(self, obj):
        return merge_field_config(obj.field_config)
