'use client'
import { useState, useEffect, useRef } from 'react'
import { News } from '@/types'
import NewsPage from './NewsPage'
import IndexPage from './IndexPage'
import LibraryPage from './LibraryPage'
import ArchivePage from './ArchivePage'
import styles from './Newspaper.module.css'
import { ChevronDown, ChevronUp, Mic, Play, Pause } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NewspaperProps {
    news: News[]
    archive: News[]
}

export default function Newspaper({ news, archive }: NewspaperProps) {
    const [mounted, setMounted] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)
    const [podcastUrl, setPodcastUrl] = useState<string | null>(null)
    const [isPodcastPlaying, setIsPodcastPlaying] = useState(false)
    const podcastAudioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setMounted(true)
        fetchPodcast()

        // Scroll to cover on load (it will be after the archive)
        setTimeout(() => {
            const cover = document.getElementById('page-cover')
            cover?.scrollIntoView({ behavior: 'instant' })
        }, 100)
    }, [])

    const fetchPodcast = async () => {
        const today = new Date().toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('daily_metadata')
            .select('podcast_url')
            .eq('date', today)
            .single()

        if (data?.podcast_url) {
            setPodcastUrl(data.podcast_url)
        }
    }

    const handlePodcastToggle = () => {
        if (!podcastUrl) return

        if (isPodcastPlaying) {
            podcastAudioRef.current?.pause()
            setIsPodcastPlaying(false)
        } else {
            if (!podcastAudioRef.current) {
                podcastAudioRef.current = new Audio(podcastUrl)
                podcastAudioRef.current.onended = () => setIsPodcastPlaying(false)
            }
            podcastAudioRef.current.play()
            setIsPodcastPlaying(true)
        }
    }

    if (!mounted) return null

    const navigateTo = (id: string) => {
        const element = document.getElementById(id)
        element?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.scrollContainer}>
                {/* Archive (Scroll UP from cover) */}
                <section id="page-archive" className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <ArchivePage archive={archive} onNavigateToNews={() => { }} />
                    </div>
                </section>

                {/* Cover */}
                <section id="page-cover" className={styles.fullPage}>
                    <div className={styles.cover}>
                        <div className={styles.archiveHint} onClick={() => navigateTo('page-archive')}>
                            <ChevronUp className={styles.bounceUp} />
                            <span>Hemeroteca (Últimos 15 días)</span>
                        </div>

                        <h1>Noticias IA Diarias</h1>
                        <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                        {podcastUrl && (
                            <button className={styles.podcastButton} onClick={handlePodcastToggle}>
                                <div className={styles.podcastIconWrapper}>
                                    {isPodcastPlaying ? <Pause size={24} /> : <Mic size={24} />}
                                </div>
                                <span>{isPodcastPlaying ? 'Pausar Podcast' : 'Escuchar Podcast Diario'}</span>
                            </button>
                        )}

                        <div className={styles.scrollHint}>
                            <span>Desliza para leer</span>
                            <ChevronDown className={styles.bounce} />
                        </div>
                    </div>
                </section>

                {/* Index */}
                <section id="page-index" className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <IndexPage news={news} onNavigate={(index) => navigateTo(`page-news-${index}`)} />
                    </div>
                </section>

                {/* News Pages */}
                {news.map((item, index) => (
                    <section key={item.id} id={`page-news-${index}`} className={styles.fullPage}>
                        <div className={styles.pageContent}>
                            <NewsPage newsItem={item} pageNumber={index + 1} />
                        </div>
                    </section>
                ))}

                {/* Library */}
                <section id="page-library" className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <LibraryPage />
                    </div>
                </section>

                {/* Back Cover */}
                <section id="page-backcover" className={styles.fullPage}>
                    <div className={styles.backCover}>
                        <h2>Fin de la Edición</h2>
                        <button onClick={() => navigateTo('page-cover')} className={styles.topButton}>
                            <ChevronUp /> Volver al inicio
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
