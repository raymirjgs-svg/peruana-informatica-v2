import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/connection";

interface BlogTitleSuggestionAttributes {
  id: number;
  suggested_title: string;
  topic?: string;
  ai_prompt?: string;
  ai_model?: string;
  status: "pending" | "selected" | "rejected" | "used";
  blog_post_id?: number;
  generated_at: Date;
  selected_at?: Date;
  used_at?: Date;
}

interface BlogTitleSuggestionCreationAttributes
  extends Optional<
    BlogTitleSuggestionAttributes,
    | "id"
    | "topic"
    | "ai_prompt"
    | "ai_model"
    | "blog_post_id"
    | "generated_at"
    | "selected_at"
    | "used_at"
  > {}

class BlogTitleSuggestion
  extends Model<
    BlogTitleSuggestionAttributes,
    BlogTitleSuggestionCreationAttributes
  >
  implements BlogTitleSuggestionAttributes
{
  public id!: number;
  public suggested_title!: string;
  public topic?: string;
  public ai_prompt?: string;
  public ai_model?: string;
  public status!: "pending" | "selected" | "rejected" | "used";
  public blog_post_id?: number;
  public readonly generated_at!: Date;
  public selected_at?: Date;
  public used_at?: Date;

  // Método para marcar como seleccionado
  public async markAsSelected(): Promise<void> {
    await this.update({
      status: "selected",
      selected_at: new Date(),
    });
  }

  // Método para marcar como rechazado
  public async markAsRejected(): Promise<void> {
    await this.update({
      status: "rejected",
    });
  }

  // Método para marcar como usado y asociar con un post
  public async markAsUsed(blogPostId: number): Promise<void> {
    await this.update({
      status: "used",
      blog_post_id: blogPostId,
      used_at: new Date(),
    });
  }

  // Método para verificar si está disponible para usar
  public isAvailable(): boolean {
    return this.status === "pending" || this.status === "selected";
  }

  // Método para obtener el tiempo transcurrido desde la generación
  public getTimeAgo(): string {
    const now = new Date();
    const diffMs = now.getTime() - this.generated_at.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;
    } else if (diffMinutes > 0) {
      return `hace ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;
    } else {
      return "hace menos de un minuto";
    }
  }
}

BlogTitleSuggestion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    suggested_title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El título sugerido es requerido",
        },
        len: {
          args: [10, 255],
          msg: "El título debe tener entre 10 y 255 caracteres",
        },
      },
    },
    topic: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [0, 100],
          msg: "El tema no puede tener más de 100 caracteres",
        },
      },
    },
    ai_prompt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Prompt usado para generar el título",
    },
    ai_model: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: {
          args: [
            [
              "gpt-4",
              "gpt-4-turbo",
              "gpt-3.5-turbo",
              "gpt-4o-mini",
              "claude-3",
              "gemini-pro",
              "gemini-1.5-pro",
              "gemini-1.5-flash",
              "gemini-2.0-flash-exp",
              "gemini-1.5-flash-latest",
              "gemini-1.5-pro-latest",
            ],
          ],
          msg: "Modelo de IA no válido",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "selected", "rejected", "used"),
      allowNull: false,
      defaultValue: "pending",
    },
    blog_post_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "blog_posts",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
    generated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    selected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "BlogTitleSuggestion",
    tableName: "blog_title_suggestions",
    timestamps: false, // Usamos campos personalizados para timestamps
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["topic"],
      },
      {
        fields: ["blog_post_id"],
      },
      {
        fields: ["generated_at"],
      },
      {
        fields: ["ai_model"],
      },
    ],
    hooks: {
      beforeValidate: (suggestion: BlogTitleSuggestion) => {
        // Limpiar espacios en blanco
        if (suggestion.suggested_title) {
          suggestion.suggested_title = suggestion.suggested_title.trim();
        }
        if (suggestion.topic) {
          suggestion.topic = suggestion.topic.trim();
        }
        if (suggestion.ai_prompt) {
          suggestion.ai_prompt = suggestion.ai_prompt.trim();
        }
      },
    },
  },
);

export {
  BlogTitleSuggestion,
  type BlogTitleSuggestionAttributes,
  type BlogTitleSuggestionCreationAttributes,
};
