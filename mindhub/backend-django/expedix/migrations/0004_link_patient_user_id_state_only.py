from django.db import migrations, models
import uuid

class Migration(migrations.Migration):

    dependencies = [
        ('expedix', '0003_add_consultation_templates'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],
            state_operations=[
                migrations.AddField(
                    model_name='patient',
                    name='user_id',
                    field=models.UUIDField(null=True, blank=True, db_index=True, verbose_name='Owner (Supabase user)'),
                ),
            ],
        ),
    ]
