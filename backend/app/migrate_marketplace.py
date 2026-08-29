from __future__ import annotations

import json
import sqlite3
from pathlib import Path

from sqlalchemy import inspect, text

from .database import engine


def get_database_path() -> Path:
    """
    Resolve the SQLite database path used by the current engine.
    """

    url = str(engine.url)

    if not url.startswith("sqlite:///"):
        raise RuntimeError(
            "This migration currently expects a SQLite database."
        )

    raw_path = url.replace(
        "sqlite:///",
        "",
        1,
    )

    path = Path(raw_path)

    if not path.is_absolute():
        path = Path.cwd() / path

    return path.resolve()


def column_names(connection, table_name: str) -> set[str]:
    rows = connection.execute(
        text(f"PRAGMA table_info({table_name})")
    ).fetchall()

    return {
        str(row[1])
        for row in rows
    }


def table_exists(connection, table_name: str) -> bool:
    inspector = inspect(
        connection
    )

    return inspector.has_table(
        table_name
    )


def add_column_if_missing(
    connection,
    table_name: str,
    column_sql: str,
) -> None:
    """
    Add a SQLite column only when it does not already exist.

    column_sql must be a safe, code-defined SQL fragment.
    """

    column_name = column_sql.split()[0]

    existing = column_names(
        connection,
        table_name,
    )

    if column_name in existing:
        print(
            f"SKIP: {table_name}.{column_name} already exists"
        )
        return

    connection.execute(
        text(
            f"ALTER TABLE {table_name} "
            f"ADD COLUMN {column_sql}"
        )
    )

    print(
        f"ADDED: {table_name}.{column_name}"
    )


def create_vendor_profiles(connection) -> None:
    if table_exists(
        connection,
        "vendor_profiles",
    ):
        print(
            "SKIP: vendor_profiles table already exists"
        )
        return

    connection.execute(
        text(
            """
            CREATE TABLE vendor_profiles (
                id INTEGER NOT NULL PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE,
                business_name VARCHAR(150) NOT NULL,
                business_email VARCHAR(255) NOT NULL,
                business_phone VARCHAR(20) NOT NULL,
                business_description TEXT,
                logo VARCHAR(500),
                business_address TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'active',
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                FOREIGN KEY(user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE
            )
            """
        )
    )

    connection.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS
            ix_vendor_profiles_id
            ON vendor_profiles(id)
            """
        )
    )

    connection.execute(
        text(
            """
            CREATE INDEX IF NOT EXISTS
            ix_vendor_profiles_user_id
            ON vendor_profiles(user_id)
            """
        )
    )

    print(
        "CREATED: vendor_profiles"
    )


def migrate() -> None:
    database_path = get_database_path()

    print(
        "LUXORA MARKETPLACE MIGRATION"
    )

    print(
        f"DATABASE: {database_path}"
    )

    if not database_path.exists():
        raise RuntimeError(
            f"Database file not found: {database_path}"
        )

    # --------------------------------------------------------
    # BACKUP
    # --------------------------------------------------------

    backup_path = database_path.with_suffix(
        ".before_marketplace_backup.db"
    )

    if not backup_path.exists():
        backup_path.write_bytes(
            database_path.read_bytes()
        )

        print(
            f"BACKUP CREATED: {backup_path}"
        )
    else:
        print(
            f"BACKUP EXISTS: {backup_path}"
        )

    # --------------------------------------------------------
    # CONNECT THROUGH SQLALCHEMY
    # --------------------------------------------------------

    with engine.begin() as connection:

        # ====================================================
        # USERS
        # ====================================================

        if not table_exists(
            connection,
            "users",
        ):
            raise RuntimeError(
                "users table does not exist."
            )

        add_column_if_missing(
            connection,
            "users",
            "role VARCHAR(20) NOT NULL DEFAULT 'customer'",
        )

        # Existing users remain customers.
        connection.execute(
            text(
                """
                UPDATE users
                SET role = 'customer'
                WHERE role IS NULL
                   OR TRIM(role) = ''
                """
            )
        )

        # ====================================================
        # PRODUCTS
        # ====================================================

        if not table_exists(
            connection,
            "products",
        ):
            raise RuntimeError(
                "products table does not exist."
            )

        add_column_if_missing(
            connection,
            "products",
            "vendor_id INTEGER",
        )

        add_column_if_missing(
            connection,
            "products",
            "brand VARCHAR(150)",
        )

        add_column_if_missing(
            connection,
            "products",
            "subcategory VARCHAR(100)",
        )

        add_column_if_missing(
            connection,
            "products",
            "images_json TEXT",
        )

        add_column_if_missing(
            connection,
            "products",
            "sku VARCHAR(100)",
        )

        add_column_if_missing(
            connection,
            "products",
            "specifications_json TEXT",
        )

        add_column_if_missing(
            connection,
            "products",
            "updated_at DATETIME",
        )

        # Existing products stay as platform/LUXORA products.
        connection.execute(
            text(
                """
                UPDATE products
                SET updated_at = created_at
                WHERE updated_at IS NULL
                """
            )
        )

        # ====================================================
        # ORDER ITEMS
        # ====================================================

        if not table_exists(
            connection,
            "order_items",
        ):
            raise RuntimeError(
                "order_items table does not exist."
            )

        add_column_if_missing(
            connection,
            "order_items",
            "vendor_id INTEGER",
        )

        # Existing historical order items retain NULL (the default for the
        # newly-added nullable column).  Do not overwrite values here: this
        # migration is intentionally safe to run repeatedly at application
        # startup, and later orders snapshot their actual vendor ownership.

        # ====================================================
        # VENDOR PROFILES
        # ====================================================

        create_vendor_profiles(
            connection
        )

        # ====================================================
        # INDEXES
        # ====================================================

        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS
                ix_products_vendor_id
                ON products(vendor_id)
                """
            )
        )

        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS
                ix_products_sku
                ON products(sku)
                """
            )
        )

        connection.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS
                ix_order_items_vendor_id
                ON order_items(vendor_id)
                """
            )
        )

    print()
    print(
        "MIGRATION COMPLETE"
    )
    print(
        "Existing users/products/orders were preserved."
    )


if __name__ == "__main__":
    migrate()
