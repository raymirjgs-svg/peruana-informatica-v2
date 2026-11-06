import { DataTypes, QueryInterface } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Crear tabla de cotizaciones
    await queryInterface.createTable('quotations', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      igv: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      client_email: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      client_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      client_company: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      client_ruc: {
        type: DataTypes.STRING(11),
        allowNull: true
      },
      client_address: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'accepted', 'rejected', 'expired'),
        defaultValue: 'pending'
      },
      valid_until: {
        type: DataTypes.DATE,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Crear tabla de items de cotización
    await queryInterface.createTable('quotation_items', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      quotation_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'quotations',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'RESTRICT'
      },
      product_name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      product_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Crear tabla de compatibilidades de componentes
    await queryInterface.createTable('component_compatibilities', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      parent_component_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      parent_component_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      child_component_type: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      child_component_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      compatibility_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    });

    // Agregar índices únicos y claves foráneas
    await queryInterface.addIndex('quotations', ['code'], {
      name: 'quotations_code_unique',
      unique: true
    });

    await queryInterface.addIndex('quotations', ['status'], {
      name: 'quotations_status_index'
    });

    await queryInterface.addIndex('quotations', ['client_email'], {
      name: 'quotations_client_email_index'
    });

    await queryInterface.addIndex('quotation_items', ['quotation_id'], {
      name: 'quotation_items_quotation_id_index'
    });

    await queryInterface.addIndex('quotation_items', ['product_id'], {
      name: 'quotation_items_product_id_index'
    });

    await queryInterface.addConstraint('component_compatibilities', {
      type: 'unique',
      fields: ['parent_component_id', 'child_component_id'],
      name: 'unique_component_compatibility'
    });

    // Añadir campos nuevos a la tabla de productos
    await queryInterface.addColumn('products', 'component_type', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    await queryInterface.addColumn('products', 'component_specs', {
      type: DataTypes.JSON,
      allowNull: true
    });

    // Añadir índices para los nuevos campos
    await queryInterface.addIndex('products', ['component_type'], {
      name: 'products_component_type_index'
    });

    // Añadir campo para especificaciones de componentes en la tabla de subcategorías
    await queryInterface.addColumn('sub_categories', 'component_spec_field', {
      type: DataTypes.STRING(50),
      allowNull: true
    });

    await queryInterface.addIndex('sub_categories', ['component_spec_field'], {
      name: 'sub_categories_component_spec_field_index'
    });

    // Añadir campo para orden de presentación en la tabla de productos
    await queryInterface.addColumn('products', 'display_order', {
      type: DataTypes.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addIndex('products', ['display_order'], {
      name: 'products_display_order_index'
    });
  },

  down: async (queryInterface: QueryInterface) => {
    // Eliminar índices primero
    await queryInterface.removeIndex('products', 'products_display_order_index');
    await queryInterface.removeIndex('sub_categories', 'sub_categories_component_spec_field_index');
    await queryInterface.removeIndex('products', 'products_component_type_index');
    await queryInterface.removeIndex('quotation_items', 'quotation_items_product_id_index');
    await queryInterface.removeIndex('quotation_items', 'quotation_items_quotation_id_index');
    await queryInterface.removeIndex('quotations', 'quotations_client_email_index');
    await queryInterface.removeIndex('quotations', 'quotations_status_index');
    await queryInterface.removeIndex('quotations', 'quotations_code_unique');

    // Eliminar campos añadidos
    await queryInterface.removeColumn('products', 'display_order');
    await queryInterface.removeColumn('sub_categories', 'component_spec_field');
    await queryInterface.removeColumn('products', 'component_specs');
    await queryInterface.removeColumn('products', 'component_type');

    // Eliminar tablas en orden inverso
    await queryInterface.dropTable('component_compatibilities');
    await queryInterface.dropTable('quotation_items');
    await queryInterface.dropTable('quotations');
  }
};