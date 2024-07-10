from django.db.models import Lookup
from django.db.models.fields import Field
from django.db.models.lookups import Lookup
from django.conf import settings
@Field.register_lookup
class CustomGTELookup(Lookup):
    lookup_name = 'custom_gte'

    def as_mysql(self, compiler, connection, **extra_context):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        if(not settings.TODAY_AS_HISTORY):
            return '%s > %s' % (lhs, rhs), params
        return '%s >= %s' % (lhs, rhs), params
        
@Field.register_lookup
class CustomLTELookup(Lookup):
    lookup_name = 'custom_lte'

    def as_mysql(self, compiler, connection, **extra_context):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        if(not settings.TODAY_AS_HISTORY):
            return '%s < %s' % (lhs, rhs), params
        return '%s <= %s' % (lhs, rhs), params

@Field.register_lookup
class CustomLTLookup(Lookup):
    lookup_name = 'custom_lt'

    def as_mysql(self, compiler, connection, **extra_context):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        if(not settings.TODAY_AS_HISTORY):
            return '%s <= %s' % (lhs, rhs), params
        return '%s < %s' % (lhs, rhs), params
@Field.register_lookup
class CustomGTLookup(Lookup):
    lookup_name = 'custom_gt'

    def as_mysql(self, compiler, connection, **extra_context):
        lhs, lhs_params = self.process_lhs(compiler, connection)
        rhs, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        if(not settings.TODAY_AS_HISTORY):
            return '%s >= %s' % (lhs, rhs), params
        return '%s > %s' % (lhs, rhs), params