'use client'
import { useState, useEffect } from 'react'
import { News } from '@/types'
import NewsPage from './NewsPage'
import IndexPage from './IndexPage'
import LibraryPage from './LibraryPage'
import styles from './Newspaper.module.css'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface NewspaperProps {
    news: News[]
}

export default function Newspaper({ news }: NewspaperProps) {
    const [mounted, setMounted] = useState(false)
    const [currentPage, setCurrentPage] = useState(0)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const totalPages = news.length + 3 // Cover, Index, News..., Library, BackCover

    const navigateTo = (index: number) => {
        setCurrentPage(index)
        const element = document.getElementById(`page-${index}`)
        element?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.scrollContainer}>
                {/* Cover */}
                <section id="page-0" className={styles.fullPage}>
                    <div className={styles.cover}>
                        <h1>Noticias IA Diarias</h1>
                        <p>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <div className={styles.scrollHint}>
                            <span>Desliza para leer</span>
                            <ChevronDown className={styles.bounce} />
                        </div>
                    </div>
                </section>

                {/* Index */}
                <section id="page-1" className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <IndexPage news={news} onNavigate={(index) => navigateTo(index + 2)} />
                    </div>
                </section>

                {/* News Pages */}
                {news.map((item, index) => (
                    <section key={item.id} id={`page-${index + 2}`} className={styles.fullPage}>
                        <div className={styles.pageContent}>
                            <NewsPage newsItem={item} pageNumber={index + 1} />
                        </div>
                    </section>
                ))}

                {/* Library */}
                <section id={`page-${news.length + 2}`} className={styles.fullPage}>
                    <div className={styles.pageContent}>
                        <LibraryPage />
                    </div>
                </section>

                {/* Back Cover */}
                <section id={`page-${news.length + 3}`} className={styles.fullPage}>
                    <div className={styles.backCover}>
                        <h2>Fin de la Edición</h2>
                        <button onClick={() => navigateTo(0)} className={styles.topButton}>
                            <ChevronUp /> Volver al inicio
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
