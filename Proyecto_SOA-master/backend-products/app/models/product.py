# app/models/product.py
from app.config.database import db
from mysql.connector import Error

class Product:
    @staticmethod
    def get_all(filters=None):
        """Obtener todos los productos con filtros opcionales"""
        try:
            query = """
                SELECT 
                    p.id, p.name, p.description, p.price, p.stock,
                    p.product_type, p.rating, p.is_active,
                    c.name as category_name,
                    pl.name as platform_name,
                    g.name as genre_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN platforms pl ON p.platform_id = pl.id
                LEFT JOIN genres g ON p.genre_id = g.id
                WHERE p.is_active = TRUE
            """
            params = []

            # Aplicar filtros
            if filters:
                if filters.get('name'):
                    query += " AND p.name LIKE %s"
                    params.append(f"%{filters['name']}%")
                
                if filters.get('category_id'):
                    query += " AND p.category_id = %s"
                    params.append(filters['category_id'])
                
                if filters.get('platform_id'):
                    query += " AND p.platform_id = %s"
                    params.append(filters['platform_id'])
                
                if filters.get('genre_id'):
                    query += " AND p.genre_id = %s"
                    params.append(filters['genre_id'])
                
                if filters.get('product_type'):
                    query += " AND p.product_type = %s"
                    params.append(filters['product_type'])

            query += " ORDER BY p.name"

            with db.get_cursor() as cursor:
                cursor.execute(query, params)
                products = cursor.fetchall()
                return products

        except Error as e:
            print(f"Error al obtener productos: {e}")
            raise e

    @staticmethod
    def get_by_id(product_id):
        """Obtener producto por ID"""
        try:
            query = """
                SELECT 
                    p.id, p.name, p.description, p.price, p.stock,
                    p.category_id, p.platform_id, p.genre_id,
                    p.product_type, p.rating, p.is_active,
                    c.name as category_name,
                    pl.name as platform_name,
                    g.name as genre_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN platforms pl ON p.platform_id = pl.id
                LEFT JOIN genres g ON p.genre_id = g.id
                WHERE p.id = %s
            """

            with db.get_cursor() as cursor:
                cursor.execute(query, (product_id,))
                product = cursor.fetchone()
                return product

        except Error as e:
            print(f"Error al obtener producto: {e}")
            raise e

    @staticmethod
    def create(product_data):
        """Crear nuevo producto"""
        try:
            query = """
                INSERT INTO products 
                (name, description, price, stock, category_id, 
                 platform_id, genre_id, product_type, rating)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            params = (
                product_data['name'],
                product_data.get('description'),
                product_data['price'],
                product_data['stock'],
                product_data['category_id'],
                product_data.get('platform_id'),
                product_data.get('genre_id'),
                product_data['product_type'],
                product_data.get('rating')
            )

            with db.get_cursor() as cursor:
                cursor.execute(query, params)
                product_id = cursor.lastrowid
                return product_id

        except Error as e:
            print(f"Error al crear producto: {e}")
            raise e

    @staticmethod
    def update(product_id, product_data):
        """Actualizar producto existente"""
        try:
            query = """
                UPDATE products 
                SET name = %s, description = %s, price = %s, stock = %s,
                    category_id = %s, platform_id = %s, genre_id = %s,
                    product_type = %s, rating = %s
                WHERE id = %s
            """
            
            params = (
                product_data['name'],
                product_data.get('description'),
                product_data['price'],
                product_data['stock'],
                product_data['category_id'],
                product_data.get('platform_id'),
                product_data.get('genre_id'),
                product_data['product_type'],
                product_data.get('rating'),
                product_id
            )

            with db.get_cursor() as cursor:
                cursor.execute(query, params)
                return cursor.rowcount > 0

        except Error as e:
            print(f"Error al actualizar producto: {e}")
            raise e

    @staticmethod
    def delete(product_id):
        """Eliminar producto (soft delete)"""
        try:
            query = "UPDATE products SET is_active = FALSE WHERE id = %s"

            with db.get_cursor() as cursor:
                cursor.execute(query, (product_id,))
                return cursor.rowcount > 0

        except Error as e:
            print(f"Error al eliminar producto: {e}")
            raise e

    @staticmethod
    def update_stock(product_id, quantity):
        """Actualizar stock después de venta"""
        try:
            query = """
                UPDATE products 
                SET stock = stock - %s
                WHERE id = %s AND stock >= %s
            """

            with db.get_cursor() as cursor:
                cursor.execute(query, (quantity, product_id, quantity))
                return cursor.rowcount > 0

        except Error as e:
            print(f"Error al actualizar stock: {e}")
            raise e