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

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className={styles.container}>
            {/* @ts-ignore */}
            <HTMLFlipBook
                width={500}
                height={700}
                size="stretch"
                minWidth={300}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                className={styles.book}
                ref={book}
                flippingTime={1000}
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
