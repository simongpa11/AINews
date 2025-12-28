const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // Or SERVICE_ROLE_KEY for writing if RLS blocks anon

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('Generating daily news...')

    // 1. Fetch summary from ChatGPT (Mocked here)
    const summary = "Hoy en IA: Rumores sobre Nano Banana 3.0 se extienden. OpenAI anuncia nueva colaboración. DeepMind resuelve el plegamiento de proteínas de nuevo."
    const title = "Resumen Diario IA: " + new Date().toLocaleDateString('es-ES')

    // 2. Generate Image with Nano Banana 2.0 (Mocked URL)
    // In reality: Call API -> Upload to storage -> Get URL
    const imageUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995"

    // 3. Generate Audio (Mocked)
    // In reality: Call ElevenLabs/Google TTS -> Upload -> Get URL
    const audioUrl = null

    // 4. Insert into Supabase
    const { data, error } = await supabase
        .from('news')
        .insert({
            title,
            summary,
            content: summary, // Full content
            image_url: imageUrl,
            audio_url: audioUrl,
            relevance_score: Math.floor(Math.random() * 10) + 1,
            original_url: 'https://openai.com'
        })
        .select()

    if (error) {
        console.error('Error inserting news:', error)
    } else {
        console.log('Success! News inserted:', data)
    }
}

main()
