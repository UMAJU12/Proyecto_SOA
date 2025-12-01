# run.py
from app import create_app
from app.config.database import db
import os

# Crear aplicación
app = create_app()

# Conectar a la base de datos al iniciar
with app.app_context():
    db.connect()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    
    print('=' * 50)
    print(f'🚀 Servidor Flask corriendo en puerto {port}')
    print(f'🌍 Entorno: {os.getenv("FLASK_ENV", "production")}')
    print(f'📡 URL: http://localhost:{port}')
    print('=' * 50)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=os.getenv('FLASK_ENV') == 'development'
    )