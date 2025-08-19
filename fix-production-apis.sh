#!/bin/bash

# Script to fix all production APIs that are still using BACKEND_URL

echo "🔧 Fixing production APIs..."

# List of files that need to be updated
FILES=(
  "mindhub/frontend/app/api/expedix/schedule-config/route.ts"
  "mindhub/frontend/app/api/expedix/clinic-configuration/route.ts"
  "mindhub/frontend/app/api/expedix/clinic-configuration/default/route.ts"
  "mindhub/frontend/app/api/expedix/agenda/waiting-list/route.ts"
  "mindhub/frontend/app/api/finance/income/route.ts"
  "mindhub/frontend/app/api/frontdesk/stats/today/route.ts"
  "mindhub/frontend/app/api/frontdesk/appointments/today/route.ts"
  "mindhub/frontend/app/api/frontdesk/tasks/pending/route.ts"
)

echo "Found ${#FILES[@]} files to update"

# We'll update these manually one by one since they each need different mock data
echo "Files that need updating:"
for file in "${FILES[@]}"; do
  echo "  - $file"
done

echo ""
echo "These files need to be converted to use:"
echo "  1. Supabase database directly"
echo "  2. Or return mock data for now"
echo ""
echo "✅ Ready to update APIs"