from rest_framework import serializers


class ConfiguracionSerializer(serializers.Serializer):
    principal = serializers.IntegerField(min_value=15, max_value=120)
    secundaria = serializers.IntegerField(min_value=10, max_value=90)
    amarillo = serializers.IntegerField(min_value=3, max_value=10)
    todo_rojo = serializers.IntegerField(min_value=2, max_value=10)

    def validate(self, datos):
        if datos['principal'] <= datos['secundaria']:
            raise serializers.ValidationError({'principal': 'La vía principal debe tener más tiempo que la secundaria.'})
        return datos
