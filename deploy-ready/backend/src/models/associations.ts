import { Category } from './Category';
import { SubCategory } from './SubCategory';
import { Product } from './Product';

export function initAssociations() {
    // Definir SOLO las relaciones que faltan y son necesarias para la taxonomía
    // Verificar si ya existen para no duplicar (aunque Sequelize suele sobreescribir si es idéntico, el error de alias sugiere conflicto)

    // Category <-> SubCategory
    // Usamos hasMany y belongsTo para establecer la relación 1:N
    Category.hasMany(SubCategory, { foreignKey: 'category_id', as: 'subcategories' });
    SubCategory.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

    // Category <-> Product
    Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

    // Orders
    const { Order } = require('./Order');
    const { OrderItem } = require('./OrderItem');
    const { User } = require('./User'); // Importar modelo User

    Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
    OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
    OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

    // User <-> Order
    User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
    Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Cart System
    const { Cart } = require('./Cart');
    const { CartItem } = require('./CartItem');

    User.hasOne(Cart, { foreignKey: 'user_id', as: 'cart' });
    Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' });
    CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' });

    CartItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

    // Reviews
    const { Review } = require('./Review');
    Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
    Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

    User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
    Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Wishlist
    const { Wishlist } = require('./Wishlist');
    User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlist' });
    Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
    Product.hasMany(Wishlist, { foreignKey: 'product_id', as: 'wishlistItems' });
    Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

    // Attribute System
    const { Attribute } = require('./Attribute');
    const { AttributeValue } = require('./AttributeValue');
    const { ProductAttribute } = require('./ProductAttribute');
    const { CompatibilityRule } = require('./CompatibilityRule');

    Attribute.hasMany(AttributeValue, { foreignKey: 'attribute_id', as: 'values' });
    AttributeValue.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

    Product.hasMany(ProductAttribute, { foreignKey: 'product_id', as: 'productAttributes' });
    ProductAttribute.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

    Attribute.hasMany(ProductAttribute, { foreignKey: 'attribute_id', as: 'productAttributes' });
    ProductAttribute.belongsTo(Attribute, { foreignKey: 'attribute_id', as: 'attribute' });

    AttributeValue.hasMany(ProductAttribute, { foreignKey: 'value_id', as: 'productAttributes' });
    ProductAttribute.belongsTo(AttributeValue, { foreignKey: 'value_id', as: 'attributeValue' });

    CompatibilityRule.belongsTo(Attribute, { foreignKey: 'source_attribute_id', as: 'sourceAttribute' });
    CompatibilityRule.belongsTo(AttributeValue, { foreignKey: 'source_value_id', as: 'sourceValue' });
    CompatibilityRule.belongsTo(Attribute, { foreignKey: 'target_attribute_id', as: 'targetAttribute' });
    CompatibilityRule.belongsTo(AttributeValue, { foreignKey: 'target_value_id', as: 'targetValue' });

    console.log('✅ Asociaciones de taxonomía inicializadas');
}
