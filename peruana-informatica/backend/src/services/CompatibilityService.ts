import { Product } from '../models/Product';
import { ProductAttribute } from '../models/ProductAttribute';
import { CompatibilityRule } from '../models/CompatibilityRule';
import { Attribute } from '../models/Attribute';
import { AttributeValue } from '../models/AttributeValue';

interface CompatibilityFilter {
  componentType: string;
  selectedProducts: number[]; // product IDs
}

interface CompatibilityResult {
  compatibleProductIds: number[];
  incompatibleRules?: string[];
}

class CompatibilityService {
  /**
   * Get compatible products for a given component type based on selected products
   * Example: User selected AMD motherboard → return only AMD CPUs
   */
  async getCompatibleProducts(
    targetComponentType: string,
    selectedProducts: number[]
  ): Promise<CompatibilityResult> {
    try {
      if (selectedProducts.length === 0) {
        // No products selected, return all products of target type
        const allProducts = await Product.findAll({
          where: { component_type: targetComponentType },
          attributes: ['cod_producto']
        });
        return {
          compatibleProductIds: allProducts.map(p => p.cod_producto)
        };
      }

      // Get attributes of all selected products
      const selectedProductAttributes = await ProductAttribute.findAll({
        where: {
          product_id: selectedProducts
        },
        include: [
          {
            model: Attribute,
            as: 'attribute',
            required: true
          },
          {
            model: AttributeValue,
            as: 'attributeValue',
            required: false
          }
        ]
      });

      // Get all active compatibility rules
      const compatibilityRules = await CompatibilityRule.findAll({
        where: {
          is_active: true,
          target_component_type: targetComponentType
        },
        include: [
          { model: Attribute, as: 'sourceAttribute' },
          { model: AttributeValue, as: 'sourceValue' },
          { model: Attribute, as: 'targetAttribute' },
          { model: AttributeValue, as: 'targetValue' }
        ]
      });

      if (compatibilityRules.length === 0) {
        // No rules defined, return all products
        const allProducts = await Product.findAll({
          where: { component_type: targetComponentType },
          attributes: ['cod_producto']
        });
        return {
          compatibleProductIds: allProducts.map(p => p.cod_producto)
        };
      }

      // Build compatibility constraints
      const requiredTargetValueIds: number[] = [];

      for (const rule of compatibilityRules) {
        // Check if any selected product matches the source criteria
        const matchingSource = selectedProductAttributes.find(pa =>
          pa.attribute_id === rule.source_attribute_id &&
          pa.value_id === rule.source_value_id
        );

        if (matchingSource) {
          requiredTargetValueIds.push(rule.target_value_id);
        }
      }

      if (requiredTargetValueIds.length === 0) {
        // No matching rules, return all products
        const allProducts = await Product.findAll({
          where: { component_type: targetComponentType },
          attributes: ['cod_producto']
        });
        return {
          compatibleProductIds: allProducts.map(p => p.cod_producto)
        };
      }

      // Find products that have ALL required target attributes
      const compatibleProducts = await Product.findAll({
        where: { component_type: targetComponentType },
        include: [
          {
            model: ProductAttribute,
            as: 'productAttributes',
            where: {
              value_id: requiredTargetValueIds
            },
            required: true
          }
        ],
        attributes: ['cod_producto']
      });

      return {
        compatibleProductIds: compatibleProducts.map(p => p.cod_producto)
      };

    } catch (error) {
      console.error('Error in getCompatibleProducts:', error);
      throw error;
    }
  }

  /**
   * Validate if a full PC build is compatible
   */
  async validateBuild(productIds: number[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Get all products with their attributes
      const products = await Product.findAll({
        where: { cod_producto: productIds },
        include: [
          {
            model: ProductAttribute,
            as: 'productAttributes',
            include: [
              { model: Attribute, as: 'attribute' },
              { model: AttributeValue, as: 'attributeValue' }
            ]
          }
        ]
      });

      // Group products by component type
      const productsByType = new Map<string, typeof products>();
      for (const product of products) {
        const type = product.component_type || 'unknown';
        if (!productsByType.has(type)) {
          productsByType.set(type, []);
        }
        productsByType.get(type)!.push(product);
      }

      // Get all active compatibility rules
      const rules = await CompatibilityRule.findAll({
        where: { is_active: true },
        include: [
          { model: Attribute, as: 'sourceAttribute' },
          { model: AttributeValue, as: 'sourceValue' },
          { model: Attribute, as: 'targetAttribute' },
          { model: AttributeValue, as: 'targetValue' }
        ]
      });

      // Check each rule
      for (const rule of rules) {
        const sourceProducts = productsByType.get(rule.source_component_type) || [];
        const targetProducts = productsByType.get(rule.target_component_type) || [];

        for (const sourceProduct of sourceProducts) {
          const sourceAttrs = (sourceProduct as any).productAttributes || [];
          const hasSourceMatch = sourceAttrs.some(
            (attr: any) => attr.attribute_id === rule.source_attribute_id &&
              attr.value_id === rule.source_value_id
          );

          if (hasSourceMatch && targetProducts.length > 0) {
            // Check if target product has required attribute
            const targetHasMatch = targetProducts.some(targetProduct => {
              const targetAttrs = (targetProduct as any).productAttributes || [];
              return targetAttrs.some(
                (attr: any) => attr.attribute_id === rule.target_attribute_id &&
                  attr.value_id === rule.target_value_id
              );
            });

            if (!targetHasMatch) {
              errors.push(
                `Incompatibilidad: ${rule.rule_name} - ${(sourceProduct as any).nombre} requiere un ${rule.target_component_type} compatible`
              );
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };

    } catch (error) {
      console.error('Error in validateBuild:', error);
      throw error;
    }
  }

  /**
   * Get attributes by component type
   */
  async getAttributesByComponentType(componentType: string) {
    return await Attribute.findAll({
      where: { component_type: componentType },
      include: [
        {
          model: AttributeValue,
          as: 'values',
          required: false
        }
      ],
      order: [['display_order', 'ASC']]
    });
  }
}

export const compatibilityService = new CompatibilityService();