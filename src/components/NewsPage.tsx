import { News } from '@/types'
import Image from 'next/image'
import { Play, Bookmark, Pause } from 'lucide-react'
import styles from './NewsPage.module.css'
import { forwardRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface NewsPageProps {
    newsItem: News
    pageNumber: number
}

const NewsPage = forwardRef<HTMLDivElement, NewsPageProps>(({ newsItem, pageNumber }, ref) => {
    const [isPlaying, setIsPlaying] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    const handlePlay = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel()
            setIsPlaying(false)
            return
        }

        if (newsItem.audio_url) {
            const audio = new Audio(newsItem.audio_url)
            audio.play()
            setIsPlaying(true)
            audio.onended = () => setIsPlaying(false)
        } else {
            const utterance = new SpeechSynthesisUtterance(newsItem.summary)
            utterance.lang = 'es-ES'
            window.speechSynthesis.speak(utterance)
            setIsPlaying(true)
            utterance.onend = () => setIsPlaying(false)
        }
    }

    const handleSave = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            alert('Please login to save news')
            return
        }

        const { error } = await supabase.from('saved_news').insert({
            news_id: newsItem.id,
            user_id: user.id
        })

        if (error) {
            // Check for duplicate error (code 23505 for unique violation)
            if (error.code === '23505') {
                alert('Already saved!')
                setIsSaved(true)
            } else {
                console.error(error)
                alert('Error saving news')
            }
        } else {
            setIsSaved(true)
        }
    }

    return (
        <div className={styles.container} ref={ref}>
            <div className={styles.header}>
                <span className={styles.date}>{new Date(newsItem.created_at).toLocaleDateString()}</span>
                <span className={styles.pageNumber}>Page {pageNumber}</span>
            </div>

            <h2 className={styles.title}>{newsItem.title}</h2>

            {newsItem.image_url && (
                <div className={styles.imageContainer}>
                    <Image src={newsItem.image_url} alt={newsItem.title} fill className={styles.image} />
                </div>
            )}

            <div className={styles.actions}>
                <button className={styles.playButton} onClick={handlePlay}>
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    {isPlaying ? 'Stop' : 'Listen'}
                </button>
                <button className={styles.saveButton} onClick={handleSave} disabled={isSaved}>
                    <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                    {isSaved ? 'Saved' : 'Save'}
                </button>
            </div>

            <div className={styles.content}>
                <p>{newsItem.summary}</p>
            </div>

            <div className={styles.footer}>
                {newsItem.original_url && (
                    <a href={newsItem.original_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        Read full article -&gt;
                    </a>
                )}
            </div>
        </div>
    )
})

NewsPage.displayName = 'NewsPage'

export default NewsPage
