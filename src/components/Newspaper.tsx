'use client'
import HTMLFlipBook from 'react-pageflip'
import { useRef, useState, useEffect } from 'react'
import { News } from '@/types'
import NewsPage from './NewsPage'
import IndexPage from './IndexPage'
import LibraryPage from './LibraryPage'
import styles from './Newspaper.module.css'

interface NewspaperProps {
    news: News[]
}

export default function Newspaper({ news }: NewspaperProps) {
    const book = useRef<any>(null)
    const [mounted, setMounted] = useState(false)
    const [dimensions, setDimensions] = useState({ width: 500, height: 700 })

    useEffect(() => {
        setMounted(true)
        const handleResize = () => {
            const isMobile = window.innerWidth < 768
            const availableWidth = window.innerWidth
            const availableHeight = window.innerHeight

            // On mobile, we want single page view usually, or just fit the screen
            // react-pageflip handles single page on mobile automatically if configured

            // We calculate page dimensions. 
            // If landscape (desktop), width is half of total width (approx)
            // If portrait (mobile), width is full width

            let pageHeight = availableHeight
            let pageWidth = isMobile ? availableWidth : availableWidth / 2

            // Add some padding/margins if not strictly full bleed
            // But user wants "ocupar toda la pantalla"

            setDimensions({ width: pageWidth, height: pageHeight })
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    if (!mounted) return null

    return (
        <div className={styles.container}>
            {/* @ts-ignore */}
            <HTMLFlipBook
                width={dimensions.width}
                height={dimensions.height}
                size="fixed" // Use fixed to respect our calculated dimensions exactly
                minWidth={300}
                maxWidth={2000}
                minHeight={400}
                maxHeight={2000}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className={styles.book}
                ref={book}
                flippingTime={1000}
                usePortrait={true} // Allow single page on mobile
                startZIndex={0}
                autoSize={true}
            >
                <div className={styles.cover} data-density="hard">
                    <h1>AI News Daily</h1>
                    <p>{new Date().toLocaleDateString()}</p>
                    <p style={{ marginTop: '20px', fontSize: '0.8rem' }}>Swipe or click to turn</p>
                </div>

                <div className={styles.page}>
                    <IndexPage news={news} onNavigate={(index) => book.current?.pageFlip().flip(index + 2)} />
                </div>

                {news.map((item, index) => (
                    <div key={item.id} className={styles.page}>
                        <NewsPage newsItem={item} pageNumber={index + 1} />
                    </div>
                ))}

                <div className={styles.page}>
                    <LibraryPage />
                </div>

                <div className={styles.page}>
                    <div className={styles.backCover}>
                        <h2>End of Edition</h2>
                    </div>
                </div>
            </HTMLFlipBook>
        </div>
    )
}
