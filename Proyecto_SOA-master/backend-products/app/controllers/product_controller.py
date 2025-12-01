# app/controllers/product_controller.py
from flask import request, jsonify
from app.models.product import Product
from mysql.connector import Error

def get_products():
    """Obtener todos los productos con filtros opcionales"""
    try:
        # Obtener parámetros de query
        filters = {
            'name': request.args.get('name'),
            'category_id': request.args.get('category_id'),
            'platform_id': request.args.get('platform_id'),
            'genre_id': request.args.get('genre_id'),
            'product_type': request.args.get('product_type')
        }
        
        # Remover filtros vacíos
        filters = {k: v for k, v in filters.items() if v}

        products = Product.get_all(filters)

        return jsonify({
            'success': True,
            'count': len(products),
            'products': products
        }), 200

    except Error as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener productos',
            'error': str(e)
        }), 500

def get_product(product_id):
    """Obtener producto por ID"""
    try:
        product = Product.get_by_id(product_id)

        if not product:
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404

        return jsonify({
            'success': True,
            'product': product
        }), 200

    except Error as e:
        return jsonify({
            'success': False,
            'message': 'Error al obtener producto',
            'error': str(e)
        }), 500

def create_product():
    """Crear nuevo producto"""
    try:
        data = request.get_json()

        # Validar campos requeridos
        required_fields = ['name', 'price', 'stock', 'category_id', 'product_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo requerido: {field}'
                }), 400

        # Validar precio positivo
        if float(data['price']) < 0:
            return jsonify({
                'success': False,
                'message': 'El precio debe ser positivo'
            }), 400

        # Validar stock no negativo
        if int(data['stock']) < 0:
            return jsonify({
                'success': False,
                'message': 'El stock no puede ser negativo'
            }), 400

        # Crear producto
        product_id = Product.create(data)

        # Obtener producto creado
        product = Product.get_by_id(product_id)

        return jsonify({
            'success': True,
            'message': 'Producto creado exitosamente',
            'product': product
        }), 201

    except Error as e:
        return jsonify({
            'success': False,
            'message': 'Error al crear producto',
            'error': str(e)
        }), 500

def update_product(product_id):
    """Actualizar producto existente"""
    try:
        data = request.get_json()

        # Verificar que el producto existe
        existing_product = Product.get_by_id(product_id)
        if not existing_product:
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404

        # Validar campos requeridos
        required_fields = ['name', 'price', 'stock', 'category_id', 'product_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo requerido: {field}'
                }), 400

        # Validaciones
        if float(data['price']) < 0:
            return jsonify({
                'success': False,
                'message': 'El precio debe ser positivo'
            }), 400

        if int(data['stock']) < 0:
            return jsonify({
                'success': False,
                'message': 'El stock no puede ser negativo'
            }), 400

        # Actualizar producto
        success = Product.update(product_id, data)

        if not success:
            return jsonify({
                'success': False,
                'message': 'No se pudo actualizar el producto'
            }), 400

        # Obtener producto actualizado
        product = Product.get_by_id(product_id)

        return jsonify({
            'success': True,
            'message': 'Producto actualizado exitosamente',
            'product': product
        }), 200

    except Error as e:
        return jsonify({
            'success': False,
            'message': 'Error al actualizar producto',
            'error': str(e)
        }), 500

def delete_product(product_id):
    """Eliminar producto (soft delete)"""
    try:
        # Verificar que el producto existe
        existing_product = Product.get_by_id(product_id)
        if not existing_product:
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404

        # TODO: Verificar que no tenga ventas asociadas
        # Esto lo implementaremos cuando tengamos el servicio de ventas

        # Eliminar producto
        success = Product.delete(product_id)

        if not success:
            return jsonify({
                'success': False,
                'message': 'No se pudo eliminar el producto'
            }), 400

        return jsonify({
            'success': True,
            'message': 'Producto eliminado exitosamente'
        }), 200

    except Error as e:
        return jsonify({
            'success': False,
            'message': 'Error al eliminar producto',
            'error': str(e)
        }), 500
        
def update_product_stock(product_id):
    """Actualizar stock de un producto (reducir después de una venta)"""
    try:
        from flask import request, jsonify
        from app.config.database import db
        
        data = request.get_json()
        quantity = data.get('quantity')
        
        # Validar cantidad
        if not quantity or quantity <= 0:
            return jsonify({
                'success': False,
                'message': 'Cantidad inválida'
            }), 400
        
        connection = db.get_connection()
        cursor = connection.cursor(dictionary=True)
        
        # Verificar que el producto existe y obtener stock actual
        cursor.execute(
            'SELECT id, name, stock FROM products WHERE id = %s',
            (product_id,)
        )
        product = cursor.fetchone()
        
        if not product:
            cursor.close()
            return jsonify({
                'success': False,
                'message': 'Producto no encontrado'
            }), 404
        
        current_stock = product['stock']
        product_name = product['name']
        
        # Verificar stock suficiente
        if current_stock < quantity:
            cursor.close()
            return jsonify({
                'success': False,
                'message': f'Stock insuficiente para {product_name}. Disponible: {current_stock}, Solicitado: {quantity}'
            }), 400
        
        # Actualizar stock
        new_stock = current_stock - quantity
        cursor.execute(
            'UPDATE products SET stock = %s WHERE id = %s',
            (new_stock, product_id)
        )
        connection.commit()
        cursor.close()
        
        print(f'✅ Stock actualizado: {product_name} - {current_stock} → {new_stock}')
        
        return jsonify({
            'success': True,
            'message': 'Stock actualizado correctamente',
            'data': {
                'productId': product_id,
                'productName': product_name,
                'previousStock': current_stock,
                'newStock': new_stock,
                'quantitySold': quantity
            }
        }), 200
        
    except Exception as e:
        print(f'❌ Error al actualizar stock: {str(e)}')
        return jsonify({
            'success': False,
            'message': f'Error al actualizar stock: {str(e)}'
        }), 500