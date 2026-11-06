import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../database/connection";

interface ContactAttributes {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  status: "pending" | "resolved" | "spam";
  ip_address?: string;
  user_agent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactCreationAttributes
  extends Optional<
    ContactAttributes,
    | "id"
    | "telefono"
    | "status"
    | "ip_address"
    | "user_agent"
    | "createdAt"
    | "updatedAt"
  > {}

class Contact
  extends Model<ContactAttributes, ContactCreationAttributes>
  implements ContactAttributes
{
  public id!: number;
  public nombre!: string;
  public email!: string;
  public telefono?: string;
  public asunto!: string;
  public mensaje!: string;
  public status!: "pending" | "resolved" | "spam";
  public ip_address?: string;
  public user_agent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Método para obtener el estado en español
  public getStatusText(): string {
    const statusMap = {
      pending: "Pendiente",
      resolved: "Resuelto",
      spam: "Spam",
    };
    return statusMap[this.status];
  }

  // Método para verificar si el contacto es reciente (menos de 24 horas)
  public isRecent(): boolean {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
    return this.createdAt > twentyFourHoursAgo;
  }
}

Contact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El nombre es requerido",
        },
        len: {
          args: [2, 100],
          msg: "El nombre debe tener entre 2 y 100 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: {
          msg: "El email debe tener un formato válido",
        },
        notEmpty: {
          msg: "El email es requerido",
        },
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: {
          args: [0, 20],
          msg: "El teléfono no puede tener más de 20 caracteres",
        },
      },
    },
    asunto: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El asunto es requerido",
        },
        len: {
          args: [5, 200],
          msg: "El asunto debe tener entre 5 y 200 caracteres",
        },
        isIn: {
          args: [
            [
              "consulta-producto",
              "soporte-tecnico",
              "garantia",
              "cotizacion",
              "reclamo",
              "otro",
            ],
          ],
          msg: "El asunto seleccionado no es válido",
        },
      },
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "El mensaje es requerido",
        },
        len: {
          args: [10, 2000],
          msg: "El mensaje debe tener entre 10 y 2000 caracteres",
        },
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "resolved", "spam"),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: {
          args: [["pending", "resolved", "spam"]],
          msg: "El estado debe ser: pending, resolved o spam",
        },
      },
    },
    ip_address: {
      type: DataTypes.STRING(45), // Para soportar IPv6
      allowNull: true,
      comment: "IP address del usuario que envió el formulario",
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "User agent del navegador del usuario",
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
    modelName: "Contact",
    tableName: "contacts",
    timestamps: true,
    indexes: [
      {
        fields: ["status"],
      },
      {
        fields: ["email"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["asunto"],
      },
    ],
    hooks: {
      beforeValidate: (contact: Contact) => {
        // Limpiar espacios en blanco
        if (contact.nombre) contact.nombre = contact.nombre.trim();
        if (contact.email) contact.email = contact.email.toLowerCase().trim();
        if (contact.telefono) contact.telefono = contact.telefono.trim();
        if (contact.mensaje) contact.mensaje = contact.mensaje.trim();
      },
    },
  },
);

export { Contact, type ContactAttributes, type ContactCreationAttributes };
