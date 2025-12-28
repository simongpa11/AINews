const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function clear() {
    console.log('Clearing news table...')
    const { error: error1 } = await supabase.from('news').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error1) console.error('Error clearing news:', error1)

    console.log('Clearing daily_metadata table...')
    const { error: error2 } = await supabase.from('daily_metadata').delete().neq('id', 0)
    if (error2) console.error('Error clearing metadata:', error2)

    console.log('Database cleared!')
}

clear()
