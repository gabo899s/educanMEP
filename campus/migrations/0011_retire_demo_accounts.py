from django.db import migrations

def retire(apps,schema_editor):
    User=apps.get_model('auth','User')
    User.objects.filter(email__iendswith='@luma.demo').update(is_active=False)

class Migration(migrations.Migration):
    dependencies=[('campus','0010_alter_institution_name')]
    operations=[migrations.RunPython(retire,migrations.RunPython.noop)]
