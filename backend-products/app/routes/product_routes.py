# app/routes/product_routes.py
from flask import Blueprint
from app.controllers import product_controller

# Crear blueprint
products_bp = Blueprint('products', __name__, url_prefix='/api/products')

# Rutas
products_bp.route('/', methods=['GET'])(product_controller.get_products)
products_bp.route('/<int:product_id>', methods=['GET'])(product_controller.get_product)
products_bp.route('/', methods=['POST'])(product_controller.create_product)
products_bp.route('/<int:product_id>', methods=['PUT'])(product_controller.update_product)
products_bp.route('/<int:product_id>', methods=['DELETE'])(product_controller.delete_product)