import { supabase } from '@/lib/supabase'
import Newspaper from '@/components/Newspaper'
import { News } from '@/types'

export const revalidate = 3600 // Revalidate every hour

async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching news:', error)
    return []
  }

  return data as News[]
}

export default async function Home() {
  const news = await getNews()

  // Mock data if no news found (for demo purposes)
  const displayNews = news.length > 0 ? news : [
    {
      id: '1',
      title: 'Welcome to AI News Daily',
      summary: 'This is a demo of the AI News Daily application. Once connected to the database and populated with ChatGPT summaries, your daily news will appear here.',
      relevance_score: 10,
      created_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995', // AI image placeholder
      original_url: 'https://github.com/simongpa11/AINews'
    },
    {
      id: '2',
      title: 'Nano Banana 2.0 Released',
      summary: 'Google has released Nano Banana 2.0, a revolutionary image generation model. It promises better reasoning and text rendering.',
      relevance_score: 9,
      created_at: new Date().toISOString(),
      image_url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
      original_url: '#'
    }
  ]

  return (
    <main>
      <Newspaper news={displayNews} />
    </main>
  )
}
