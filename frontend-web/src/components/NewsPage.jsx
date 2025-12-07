import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGamingNews } from '../services/api';
import './NewsPage.css';

const NewsPage = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadNews();
    }, []);

    const loadNews = async () => {
        try {
            const data = await getGamingNews();
            // Validamos que sea un array antes de filtrar
            if (Array.isArray(data)) {
                setNews(data.filter(article => article.urlToImage));
            } else {
                setNews([]);
            }
        } catch (error) {
            console.error("Error cargando noticias");
            setNews([]);
        } finally {
            setLoading(false);
        }
    };

    // --- CORRECCIÓN DEL BOTÓN VOLVER ---
    const handleBack = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'administrador') {
            navigate('/admin/products'); // Vuelve al panel con botones de Admin
        } else {
            navigate('/catalog'); // Vuelve al catálogo normal
        }
    };

    return (
        <div className="news-page">
            <div className="news-header">
                <h2>📰 Noticias Gaming</h2>
                <button className="btn-back" onClick={handleBack}>
                    Volver al Catálogo
                </button>
            </div>

            {loading ? (
                <div style={{textAlign:'center', marginTop:'50px', fontSize: '18px'}}>
                    Cargando noticias...
                </div>
            ) : news.length === 0 ? (
                // --- MENSAJE SI SALE VACÍO ---
                <div style={{textAlign:'center', marginTop:'50px', color: '#666'}}>
                    <h3>⚠️ No se encontraron noticias.</h3>
                    <p>Verifica que hayas puesto tu <b>API KEY</b> en el archivo <code>backend-users/index.js</code></p>
                </div>
            ) : (
                <div className="news-grid">
                    {news.map((article, index) => (
                        <article key={index} className="news-card">
                            <img 
                                src={article.urlToImage} 
                                alt={article.title} 
                                className="news-image"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                            <div className="news-content">
                                <span className="news-source">{article.source.name}</span>
                                <h3 className="news-title">{article.title}</h3>
                                <p className="news-desc">{article.description}</p>
                                <a 
                                    href={article.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="btn-read-more"
                                >
                                    Leer completa ↗
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsPage;