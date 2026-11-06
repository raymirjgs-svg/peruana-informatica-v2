import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/connection";

interface BlogPostAttributes {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author_name: string;
  author_email?: string;
  reading_time: number;
  views: number;
  likes: number;
  status: "draft" | "published" | "scheduled" | "archived";
  published_at?: Date;
  scheduled_at?: Date;
  is_featured: boolean;
  ai_generated: boolean;
  ai_prompt?: string;
  ai_model?: string;
  tags?: string;
  categories?: string;
  external_links?: any;
  word_count: number;
  createdAt: Date;
  updatedAt: Date;
}

interface BlogPostCreationAttributes
  extends Optional<
    BlogPostAttributes,
    | "id"
    | "excerpt"
    | "featured_image"
    | "meta_title"
    | "meta_description"
    | "meta_keywords"
    | "author_email"
    | "reading_time"
    | "views"
    | "likes"
    | "published_at"
    | "scheduled_at"
    | "is_featured"
    | "ai_generated"
    | "ai_prompt"
    | "ai_model"
    | "tags"
    | "categories"
    | "external_links"
    | "word_count"
    | "createdAt"
    | "updatedAt"
  > {}

class BlogPost
  extends Model<BlogPostAttributes, BlogPostCreationAttributes>
  implements BlogPostAttributes
{
  public id!: number;
  public title!: string;
  public slug!: string;
  public excerpt?: string;
  public content!: string;
  public featured_image?: string;
  public meta_title?: string;
  public meta_description?: string;
  public meta_keywords?: string;
  public author_name!: string;
  public author_email?: string;
  public reading_time!: number;
  public views!: number;
  public likes!: number;
  public status!: "draft" | "published" | "scheduled" | "archived";
  public published_at?: Date;
  public scheduled_at?: Date;
  public is_featured!: boolean;
  public ai_generated!: boolean;
  public ai_prompt?: string;
  public ai_model?: string;
  public tags?: string;
  public categories?: string;
  public external_links?: any;
  public word_count!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Método para generar slug automáticamente
  public static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[áäâàã]/g, 'a')
      .replace(/[éëêè]/g, 'e')
      .replace(/[íïîì]/g, 'i')
      .replace(/[óöôòõ]/g, 'o')
      .replace(/[úüûù]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^\w\s-]/g, '') // Eliminar caracteres especiales
      .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones por un solo guión
      .replace(/^-+|-+$/g, ''); // Eliminar guiones al inicio y final
  }

  // Método para calcular tiempo de lectura estimado
  public static calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }

  // Método para contar palabras
  public static countWords(content: string): number {
    return content.split(/\s+/).filter(word => word.length > 0).length;
  }

  // Método para generar excerpt automáticamente
  public static generateExcerpt(content: string, maxLength: number = 160): string {
    // Eliminar markdown y HTML
    const plainText = content
      .replace(/#{1,6}\s/g, '') // Headers markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Italic markdown
      .replace(/<[^>]*>/g, '') // HTML tags
      .replace(/\n+/g, ' ') // Multiple line breaks
      .trim();

    if (plainText.length <= maxLength) {
      return plainText;
    }

    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex > maxLength - 20) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }

    return truncated + '...';
  }

  // Método para obtener tags como array
  public getTagsArray(): string[] {
    if (!this.tags) return [];
    return this.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  // Método para obtener categorías como array
  public getCategoriesArray(): string[] {
    if (!this.categories) return [];
    return this.categories.split(",").map((cat) => cat.trim()).filter(Boolean);
  }

  // Método para verificar si está publicado
  public isPublished(): boolean {
    return this.status === 'published' &&
           this.published_at != null &&
           this.published_at <= new Date();
  }

  // Método para verificar si es un post programado
  public isScheduled(): boolean {
    return this.status === 'scheduled' &&
           this.scheduled_at != null &&
           this.scheduled_at > new Date();
  }

  // Método para obtener URL del post
  public getUrl(): string {
    return `/blog/${this.slug}`;
  }

  // Método para incrementar vistas
  public async incrementViews(): Promise<void> {
    await this.increment('views');
  }

  // Método para incrementar likes
  public async incrementLikes(): Promise<void> {
    await this.increment('likes');
  }
}

BlogPost.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El título es requerido",
        },
        len: {
          args: [5, 255],
          msg: "El título debe tener entre 5 y 255 caracteres",
        },
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: {
          msg: "El slug es requerido",
        },
        isSlug(value: string) {
          if (!/^[a-z0-9-]+$/.test(value)) {
            throw new Error("El slug solo puede contener letras minúsculas, números y guiones");
          }
        },
      },
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "El extracto no puede tener más de 500 caracteres",
        },
      },
    },
    content: {
      type: DataTypes.TEXT("long"),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El contenido es requerido",
        },
        len: {
          args: [50, 100000],
          msg: "El contenido debe tener entre 50 y 100000 caracteres",
        },
      },
    },
    featured_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: "La imagen destacada debe ser una URL válida",
        },
      },
    },
    meta_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: {
          args: [0, 255],
          msg: "El meta título no puede tener más de 255 caracteres",
        },
      },
    },
    meta_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "La meta descripción no puede tener más de 500 caracteres",
        },
      },
    },
    meta_keywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    author_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Peruana Informática",
      validate: {
        notEmpty: {
          msg: "El nombre del autor es requerido",
        },
      },
    },
    author_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: "El email del autor debe ser válido",
        },
        isValidOrEmpty(value: string) {
          if (value && value.trim() === '') {
            throw new Error("El email del autor no puede ser una cadena vacía");
          }
        },
      },
    },
    reading_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      validate: {
        min: {
          args: [1],
          msg: "El tiempo de lectura debe ser al menos 1 minuto",
        },
      },
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Las vistas no pueden ser negativas",
        },
      },
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "Los likes no pueden ser negativos",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "scheduled", "archived"),
      allowNull: false,
      defaultValue: "draft",
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ai_generated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ai_prompt: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Prompt usado para generar el contenido",
    },
    ai_model: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Modelo de IA usado (gpt-4, gpt-3.5-turbo, etc)",
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Tags separados por comas",
    },
    categories: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Categorías separadas por comas",
    },
    external_links: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Enlaces externos relacionados",
    },
    word_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: "El conteo de palabras no puede ser negativo",
        },
      },
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
    modelName: "BlogPost",
    tableName: "blog_posts",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["slug"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["published_at"],
      },
      {
        fields: ["is_featured"],
      },
      {
        fields: ["ai_generated"],
      },
      {
        fields: ["author_email"],
      },
      {
        fields: ["views"],
      },
      {
        type: "FULLTEXT",
        name: "search_content",
        fields: ["title", "excerpt", "content", "tags"],
      },
    ],
    hooks: {
      beforeValidate: (post: BlogPost) => {
        // Limpiar espacios en blanco
        if (post.title) post.title = post.title.trim();
        if (post.excerpt) post.excerpt = post.excerpt.trim();
        if (post.content) post.content = post.content.trim();
        if (post.author_name) post.author_name = post.author_name.trim();
        if (post.tags) post.tags = post.tags.trim();
        if (post.categories) post.categories = post.categories.trim();
        
        // Convertir email vacío a null
        if (post.author_email !== undefined) {
          const trimmedEmail = post.author_email?.trim() || '';
          post.author_email = trimmedEmail === '' ? undefined : trimmedEmail.toLowerCase();
        }

        // Generar slug automáticamente si no existe
        if (!post.slug && post.title) {
          post.slug = BlogPost.generateSlug(post.title);
        }

        // Calcular tiempo de lectura automáticamente
        if (post.content) {
          post.reading_time = BlogPost.calculateReadingTime(post.content);
          post.word_count = BlogPost.countWords(post.content);
        }

        // Generar excerpt automáticamente si no existe
        if (!post.excerpt && post.content) {
          post.excerpt = BlogPost.generateExcerpt(post.content);
        }

        // Establecer published_at cuando se publica
        if (post.status === 'published') {
          // Si no tiene published_at o cambió a published, establecer fecha actual
          if (!post.published_at || (post.changed('status') && post.status === 'published')) {
            post.published_at = new Date();
          }
        }

        // Generar meta_title si no existe
        if (!post.meta_title && post.title) {
          post.meta_title = `${post.title} | Blog Peruana Informática`;
        }

        // Generar meta_description si no existe pero hay excerpt
        if (!post.meta_description && post.excerpt) {
          post.meta_description = post.excerpt;
        }
      },
    },
  }
);

export { BlogPost, type BlogPostAttributes, type BlogPostCreationAttributes };
