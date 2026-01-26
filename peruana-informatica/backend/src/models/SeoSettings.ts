import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/connection";

interface SeoSettingsAttributes {
  id: number;
  page_type: string;
  page_identifier?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  canonical_url?: string;
  robots: string;
  schema_markup?: string;
  custom_head?: string;
  priority: number;
  change_frequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SeoSettingsCreationAttributes
  extends Optional<
    SeoSettingsAttributes,
    | "id"
    | "page_identifier"
    | "meta_title"
    | "meta_description"
    | "meta_keywords"
    | "og_title"
    | "og_description"
    | "og_image"
    | "twitter_title"
    | "twitter_description"
    | "twitter_image"
    | "canonical_url"
    | "schema_markup"
    | "custom_head"
    | "createdAt"
    | "updatedAt"
  > {}

class SeoSettings
  extends Model<SeoSettingsAttributes, SeoSettingsCreationAttributes>
  implements SeoSettingsAttributes
{
  public id!: number;
  public page_type!: string;
  public page_identifier?: string;
  public meta_title?: string;
  public meta_description?: string;
  public meta_keywords?: string;
  public og_title?: string;
  public og_description?: string;
  public og_image?: string;
  public twitter_title?: string;
  public twitter_description?: string;
  public twitter_image?: string;
  public canonical_url?: string;
  public robots!: string;
  public schema_markup?: string;
  public custom_head?: string;
  public priority!: number;
  public change_frequency!: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  public is_active!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Método para obtener el título efectivo
  public getEffectiveTitle(): string {
    return this.meta_title || "Peruana de Informática";
  }

  // Método para obtener la descripción efectiva
  public getEffectiveDescription(): string {
    return this.meta_description || "Tu tienda de confianza para equipos informáticos";
  }

  // Método para obtener keywords como array
  public getKeywordsArray(): string[] {
    if (!this.meta_keywords) return [];
    return this.meta_keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }

  // Método para verificar si tiene configuración Open Graph completa
  public hasCompleteOpenGraph(): boolean {
    return !!(this.og_title && this.og_description);
  }

  // Método para verificar si tiene configuración Twitter completa
  public hasCompleteTwitter(): boolean {
    return !!(this.twitter_title && this.twitter_description);
  }

  // Método para generar JSON-LD schema básico
  public generateBasicSchema(siteUrl: string = "https://peruanainformatica.com"): object | null {
    if (this.schema_markup) {
      try {
        return JSON.parse(this.schema_markup);
      } catch (error) {
        console.error("Error parsing schema markup:", error);
        return null;
      }
    }

    // Schema básico para la organización
    if (this.page_type === "global" || this.page_type === "home") {
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Peruana de Informática",
        url: siteUrl,
        description: this.getEffectiveDescription(),
        sameAs: [
          "https://facebook.com/peruanainformatica",
          "https://twitter.com/peruanainformatica",
        ],
      };
    }

    return null;
  }
}

SeoSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    page_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El tipo de página es requerido",
        },
        isIn: {
          args: [["global", "home", "products", "categories", "contact", "blog", "brands", "product", "category", "brand"]],
          msg: "Tipo de página no válido",
        },
      },
    },
    page_identifier: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Identificador específico (slug, id, etc.)",
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: "El título no puede tener más de 255 caracteres",
        },
      },
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "La descripción no puede tener más de 500 caracteres",
        },
      },
    },
    meta_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Keywords separadas por comas",
    },
    og_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Open Graph title",
    },
    og_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Open Graph description",
    },
    og_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: "La URL de imagen de Open Graph debe ser válida",
        },
      },
    },
    twitter_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    twitter_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    twitter_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: "La URL de imagen de Twitter debe ser válida",
        },
      },
    },
    canonical_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: "La URL canónica debe ser válida",
        },
      },
    },
    robots: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "index,follow",
      validate: {
        isValidRobots(value: string) {
          const validDirectives = ["index", "noindex", "follow", "nofollow", "noarchive", "nosnippet", "noimageindex"];
          const directives = value.split(",").map((d) => d.trim());

          for (const directive of directives) {
            if (!validDirectives.includes(directive)) {
              throw new Error(`Directiva de robots no válida: ${directive}`);
            }
          }
        },
      },
    },
    schema_markup: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      comment: "JSON-LD schema markup",
      validate: {
        isValidJSON(value: string) {
          if (value) {
            try {
              JSON.parse(value);
            } catch (error) {
              throw new Error("El schema markup debe ser un JSON válido");
            }
          }
        },
      },
    },
    custom_head: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "HTML personalizado para el head",
    },
    priority: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: false,
      defaultValue: 0.5,
      validate: {
        min: {
          args: [0.0],
          msg: "La prioridad debe ser entre 0.0 y 1.0",
        },
        max: {
          args: [1.0],
          msg: "La prioridad debe ser entre 0.0 y 1.0",
        },
      },
    },
    change_frequency: {
      type: DataTypes.ENUM("always", "hourly", "daily", "weekly", "monthly", "yearly", "never"),
      allowNull: false,
      defaultValue: "weekly",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "SeoSettings",
    tableName: "seo_settings",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["page_type", "page_identifier"],
        name: "unique_page",
      },
      {
        fields: ["page_type"],
      },
      {
        fields: ["is_active"],
      },
      {
        fields: ["createdAt"],
      },
    ],
    hooks: {
      beforeValidate: (seoSettings: SeoSettings) => {
        // Limpiar espacios en blanco
        if (seoSettings.meta_title) seoSettings.meta_title = seoSettings.meta_title.trim();
        if (seoSettings.meta_description) seoSettings.meta_description = seoSettings.meta_description.trim();
        if (seoSettings.meta_keywords) seoSettings.meta_keywords = seoSettings.meta_keywords.trim();
        if (seoSettings.og_title) seoSettings.og_title = seoSettings.og_title.trim();
        if (seoSettings.og_description) seoSettings.og_description = seoSettings.og_description.trim();
        if (seoSettings.twitter_title) seoSettings.twitter_title = seoSettings.twitter_title.trim();
        if (seoSettings.twitter_description) seoSettings.twitter_description = seoSettings.twitter_description.trim();
        if (seoSettings.canonical_url) seoSettings.canonical_url = seoSettings.canonical_url.trim();
        if (seoSettings.robots) seoSettings.robots = seoSettings.robots.trim();
        if (seoSettings.custom_head) seoSettings.custom_head = seoSettings.custom_head.trim();
      },
    },
  }
);

export { SeoSettings, type SeoSettingsAttributes, type SeoSettingsCreationAttributes };
