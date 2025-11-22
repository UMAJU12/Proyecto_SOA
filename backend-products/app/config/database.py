# app/config/database.py
import mysql.connector
from mysql.connector import Error
import os
from contextlib import contextmanager

class Database:
    def __init__(self):
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = os.getenv('DB_PORT', '3306')
        self.user = os.getenv('DB_USER', 'root')
        self.password = os.getenv('DB_PASSWORD', '')
        self.database = os.getenv('DB_NAME', 'gaming_store_products')
        self.connection = None

    def connect(self):
        """Establecer conexión con MySQL"""
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.user,
                password=self.password,
                database=self.database,
                autocommit=False
            )
            if self.connection.is_connected():
                db_info = self.connection.get_server_info()
                print(f"✅ Conectado a MySQL Server versión {db_info}")
                cursor = self.connection.cursor()
                cursor.execute("SELECT DATABASE();")
                record = cursor.fetchone()
                print(f"📊 Base de datos activa: {record[0]}")
                cursor.close()
                return True
        except Error as e:
            print(f"❌ Error al conectar a MySQL: {e}")
            return False

    def disconnect(self):
        """Cerrar conexión"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
            print("🔌 Conexión MySQL cerrada")

    def get_connection(self):
        """Obtener conexión activa"""
        if not self.connection or not self.connection.is_connected():
            self.connect()
        return self.connection

    @contextmanager
    def get_cursor(self, dictionary=True):
        """Context manager para manejar cursores de forma segura"""
        connection = self.get_connection()
        cursor = connection.cursor(dictionary=dictionary)
        try:
            yield cursor
            connection.commit()
        except Error as e:
            connection.rollback()
            print(f"❌ Error en operación de base de datos: {e}")
            raise e
        finally:
            cursor.close()

# Instancia global de la base de datos
db = Database()