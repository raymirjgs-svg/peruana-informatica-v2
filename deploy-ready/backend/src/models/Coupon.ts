import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';

interface CouponAttributes {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase?: number;
  max_uses?: number;
  current_uses: number;
  valid_from?: Date;
  valid_until?: Date;
  is_active: boolean;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CouponCreationAttributes extends Optional<CouponAttributes, 'id' | 'min_purchase' | 'max_uses' | 'current_uses' | 'valid_from' | 'valid_until' | 'description' | 'created_at' | 'updated_at'> { }

class Coupon extends Model<CouponAttributes, CouponCreationAttributes> implements CouponAttributes {
  public id!: number;
  public code!: string;
  public type!: 'percentage' | 'fixed';
  public value!: number;
  public min_purchase?: number;
  public max_uses?: number;
  public current_uses!: number;
  public valid_from?: Date;
  public valid_until?: Date;
  public is_active!: boolean;
  public description?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if coupon is valid
   */
  public isValid(purchaseAmount: number = 0): { valid: boolean; message?: string } {
    if (!this.is_active) {
      return { valid: false, message: 'Cupón inactivo' };
    }

    const now = new Date();

    if (this.valid_from && now < this.valid_from) {
      return { valid: false, message: 'Cupón aún no válido' };
    }

    if (this.valid_until && now > this.valid_until) {
      return { valid: false, message: 'Cupón expirado' };
    }

    if (this.max_uses && this.current_uses >= this.max_uses) {
      return { valid: false, message: 'Cupón agotado' };
    }

    if (this.min_purchase && purchaseAmount < this.min_purchase) {
      return { valid: false, message: `Compra mínima de S/. ${this.min_purchase.toFixed(2)}` };
    }

    return { valid: true };
  }

  /**
   * Calculate discount amount
   */
  public calculateDiscount(amount: number): number {
    if (this.type === 'percentage') {
      return (amount * this.value) / 100;
    } else {
      return Math.min(this.value, amount);
    }
  }
}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    min_purchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    max_uses: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_uses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    valid_from: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'coupons',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
      {
        fields: ['is_active'],
      },
    ],
  }
);

export { Coupon };
export type { CouponAttributes, CouponCreationAttributes };
