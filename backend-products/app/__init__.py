# app/__init__.py
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

def create_app():
    """Factory para crear la aplicación Flask"""
    app = Flask(__name__)
    
    # Configuración
    app.config['JSON_AS_ASCII'] = False
    app.config['JSON_SORT_KEYS'] = False
    
    # IMPORTANTE: Evitar redirecciones automáticas
    app.url_map.strict_slashes = False
    
    # CORS - Configuración permisiva para desarrollo
    CORS(app)
    
    # Importar y registrar blueprints
    from app.routes.product_routes import products_bp
    app.register_blueprint(products_bp)
    
    # Ruta raíz
    @app.route('/')
    def index():
        return {
            'success': True,
            'message': '🎮 API Gaming Store - Servicio de Productos',
            'version': '1.0.0',
            'endpoints': {
                'products': '/api/products',
                'health': '/health'
            }
        }
    
    # Ruta de salud
    @app.route('/health')
    def health():
        from app.config.database import db
        try:
            connection = db.get_connection()
            is_connected = connection.is_connected()
            
            return {
                'success': True,
                'status': 'OK' if is_connected else 'ERROR',
                'database': 'connected' if is_connected else 'disconnected'
            }
        except Exception as e:
            return {
                'success': False,
                'status': 'ERROR',
                'error': str(e)
            }, 500
    
    # Manejo de errores 404
    @app.errorhandler(404)
    def not_found(error):
        return {
            'success': False,
            'message': 'Ruta no encontrada'
        }, 404
    
    # Manejo de errores 500
    @app.errorhandler(500)
    def internal_error(error):
        return {
            'success': False,
            'message': 'Error interno del servidor'
        }, 500
    
    return app