# backend/app/api/v1/products.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Optional
from pydantic import BaseModel, field_validator
from datetime import datetime
import uuid

from app.db.session import get_db
from app.models.product import Product, ProductImage
from app.models.user import User
from app.api.v1.auth import get_current_user, require_verified_email
from app.services.storage import upload_image, delete_image
from app.core.config import settings

router = APIRouter()

# Schemas
class ProductCreate(BaseModel):
    product_name: str
    brand_name: Optional[str] = None
    price: float
    address: Optional[str] = None
    whatsapp_number: str
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v <= 0:
            raise ValueError('Price must be positive')
        return v
    
    @field_validator('whatsapp_number')
    @classmethod
    def validate_whatsapp(cls, v):
        # Remove spaces and special chars
        cleaned = ''.join(c for c in v if c.isdigit() or c == '+')
        if len(cleaned) < 10:
            raise ValueError('Invalid WhatsApp number')
        return cleaned

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    brand_name: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    whatsapp_number: Optional[str] = None
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Price must be positive')
        return v

class ProductImageResponse(BaseModel):
    id: str
    image_url: str
    display_order: int

class ProductResponse(BaseModel):
    id: str
    user_id: str
    product_name: str
    brand_name: Optional[str]
    price: float
    address: Optional[str]
    whatsapp_number: str
    is_pinned: bool
    view_count: int
    images: List[ProductImageResponse]
    created_at: datetime
    updated_at: Optional[datetime] = None  # ✅ Make optional
    is_updated: bool
    
    class Config:
        from_attributes = True

class ProductListResponse(BaseModel):
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Helper functions
async def validate_images(files: List[UploadFile]) -> List[UploadFile]:
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="At least one image is required")
    
    if len(files) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
    
    for file in files:
        # Validate MIME type
        if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.filename}. Allowed: .jpg, .jpeg, .png, .webp"
            )
        
        # Validate file size
        file.file.seek(0, 2)  # Seek to end
        size = file.file.tell()
        file.file.seek(0)  # Reset
        
        if size > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {file.filename}. Max size: 5MB"
            )
    
    return files


# Endpoints
@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductResponse)
async def create_product(
    product_name: str = Form(...),
    price: float = Form(...),
    whatsapp_number: str = Form(...),
    brand_name: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    images: List[UploadFile] = File(...),
    current_user: User = Depends(require_verified_email),
    db: AsyncSession = Depends(get_db)
):
    # Validate product data
    product_data = ProductCreate(
        product_name=product_name,
        brand_name=brand_name,
        price=price,
        address=address,
        whatsapp_number=whatsapp_number
    )
    
    # Validate images
    await validate_images(images)
    
    # Create product
    product = Product(
        user_id=current_user.id,
        product_name=product_data.product_name,
        brand_name=product_data.brand_name,
        price=product_data.price,
        address=product_data.address,
        whatsapp_number=product_data.whatsapp_number
    )
    
    db.add(product)
    await db.flush()
    
    # Upload images
    product_images = []
    for idx, image in enumerate(images):
        try:
            image_url, image_key = await upload_image(image, str(product.id))
            
            product_image = ProductImage(
                product_id=product.id,
                image_url=image_url,
                image_key=image_key,
                display_order=idx
            )
            db.add(product_image)
            product_images.append(product_image)
        except Exception as e:
            print(f"❌ Failed to upload image: {e}")
    
    await db.commit()
    await db.refresh(product)
    
    # Return response with safe defaults
    return ProductResponse(
        id=str(product.id),
        user_id=str(product.user_id),
        product_name=product.product_name,
        brand_name=product.brand_name,
        price=float(product.price),
        address=product.address,
        whatsapp_number=product.whatsapp_number,
        is_pinned=product.is_pinned,
        view_count=product.view_count,
        images=[
            ProductImageResponse(
                id=str(img.id),
                image_url=img.image_url,
                display_order=img.display_order
            )
            for img in product_images
        ],
        created_at=product.created_at,
        updated_at=product.updated_at or product.created_at,  # ✅ Fallback
        is_updated=False  # ✅ New products are never updated
    )


@router.get("/", response_model=ProductListResponse)
async def list_products(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    brand: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    # Build query
    query = select(Product).where(Product.is_active == True)
    
    if search:
        query = query.where(
            or_(
                Product.product_name.ilike(f"%{search}%"),
                Product.brand_name.ilike(f"%{search}%")
            )
        )
    
    if brand:
        query = query.where(Product.brand_name.ilike(f"%{brand}%"))
    
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Order by pinned first, then by created date
    query = query.order_by(
        Product.is_pinned.desc(),
        Product.created_at.desc()
    )
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    # Load images for each product
    product_responses = []
    for product in products:
        images_result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product.id)
            .order_by(ProductImage.display_order)
        )
        images = images_result.scalars().all()
        
        product_responses.append(
            ProductResponse(
                id=str(product.id),
                user_id=str(product.user_id),
                product_name=product.product_name,
                brand_name=product.brand_name,
                price=float(product.price),
                address=product.address,
                whatsapp_number=product.whatsapp_number,
                is_pinned=product.is_pinned,
                view_count=product.view_count,
                images=[
                    ProductImageResponse(
                        id=str(img.id),
                        image_url=img.image_url,
                        display_order=img.display_order
                    )
                    for img in images
                ],
                created_at=product.created_at,
                updated_at=product.updated_at or product.created_at,  # ✅ Safe fallback
                is_updated=bool(product.updated_at and product.updated_at > product.created_at)
            )
        )
    
    total_pages = (total + page_size - 1) // page_size
    
    return ProductListResponse(
        products=product_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/featured", response_model=List[ProductResponse])
async def get_featured_products(db: AsyncSession = Depends(get_db)):
    query = select(Product).where(
        and_(Product.is_active == True, Product.is_pinned == True)
    ).order_by(Product.created_at.desc()).limit(5)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        images_result = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product.id)
            .order_by(ProductImage.display_order)
        )
        images = images_result.scalars().all()
        
        product_responses.append(
            ProductResponse(
                id=str(product.id),
                user_id=str(product.user_id),
                product_name=product.product_name,
                brand_name=product.brand_name,
                price=float(product.price),
                address=product.address,
                whatsapp_number=product.whatsapp_number,
                is_pinned=product.is_pinned,
                view_count=product.view_count,
                images=[
                    ProductImageResponse(
                        id=str(img.id),
                        image_url=img.image_url,
                        display_order=img.display_order
                    )
                    for img in images
                ],
                created_at=product.created_at,
                updated_at=product.updated_at or product.created_at,  # ✅ Safe fallback
                is_updated=bool(product.updated_at and product.updated_at > product.created_at)
            )
        )
    
    return product_responses


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(
            and_(Product.id == uuid.UUID(product_id), Product.is_active == True)
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Increment view count
    product.view_count += 1
    await db.commit()
    
    # Load images
    images_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id)
        .order_by(ProductImage.display_order)
    )
    images = images_result.scalars().all()
    
    return ProductResponse(
        id=str(product.id),
        user_id=str(product.user_id),
        product_name=product.product_name,
        brand_name=product.brand_name,
        price=float(product.price),
        address=product.address,
        whatsapp_number=product.whatsapp_number,
        is_pinned=product.is_pinned,
        view_count=product.view_count,
        images=[
            ProductImageResponse(
                id=str(img.id),
                image_url=img.image_url,
                display_order=img.display_order
            )
            for img in images
        ],
        created_at=product.created_at,
        updated_at=product.updated_at or product.created_at,  # ✅ Safe fallback
        is_updated=bool(product.updated_at and product.updated_at > product.created_at)
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    update_data: ProductUpdate,
    current_user: User = Depends(require_verified_email),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this product")
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(product, field, value)
    
    product.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(product)
    
    # Load images
    images_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id)
        .order_by(ProductImage.display_order)
    )
    images = images_result.scalars().all()
    
    return ProductResponse(
        id=str(product.id),
        user_id=str(product.user_id),
        product_name=product.product_name,
        brand_name=product.brand_name,
        price=float(product.price),
        address=product.address,
        whatsapp_number=product.whatsapp_number,
        is_pinned=product.is_pinned,
        view_count=product.view_count,
        images=[
            ProductImageResponse(
                id=str(img.id),
                image_url=img.image_url,
                display_order=img.display_order
            )
            for img in images
        ],
        created_at=product.created_at,
        updated_at=product.updated_at,  # ✅ Will have value after update
        is_updated=True  # ✅ Always True for updated products
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user: User = Depends(require_verified_email),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == uuid.UUID(product_id))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
    # Delete images from storage
    images_result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id)
    )
    images = images_result.scalars().all()
    
    for image in images:
        await delete_image(image.image_key)
    
    # Delete product (cascade will delete images)
    await db.delete(product)
    await db.commit()
    
    return None



# # backend/app/api/v1/products.py
# from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# from sqlalchemy.ext.asyncio import AsyncSession
# from sqlalchemy import select, and_, or_, func
# from typing import List, Optional
# from pydantic import BaseModel, field_validator
# from datetime import datetime
# import uuid

# from app.db.session import get_db
# from app.models.product import Product, ProductImage
# from app.models.user import User
# from app.api.v1.auth import get_current_user, require_verified_email
# from app.services.storage import upload_image, delete_image
# from app.core.config import settings

# router = APIRouter()

# # Schemas
# class ProductCreate(BaseModel):
#     product_name: str
#     brand_name: Optional[str] = None
#     price: float
#     address: Optional[str] = None
#     whatsapp_number: str
    
#     @field_validator('price')
#     @classmethod
#     def validate_price(cls, v):
#         if v <= 0:
#             raise ValueError('Price must be positive')
#         return v
    
#     @field_validator('whatsapp_number')
#     @classmethod
#     def validate_whatsapp(cls, v):
#         # Remove spaces and special chars
#         cleaned = ''.join(c for c in v if c.isdigit() or c == '+')
#         if len(cleaned) < 10:
#             raise ValueError('Invalid WhatsApp number')
#         return cleaned

# class ProductUpdate(BaseModel):
#     product_name: Optional[str] = None
#     brand_name: Optional[str] = None
#     price: Optional[float] = None
#     address: Optional[str] = None
#     whatsapp_number: Optional[str] = None
    
#     @field_validator('price')
#     @classmethod
#     def validate_price(cls, v):
#         if v is not None and v <= 0:
#             raise ValueError('Price must be positive')
#         return v

# class ProductImageResponse(BaseModel):
#     id: str
#     image_url: str
#     display_order: int

# class ProductResponse(BaseModel):
#     id: str
#     user_id: str
#     product_name: str
#     brand_name: Optional[str]
#     price: float
#     address: Optional[str]
#     whatsapp_number: str
#     is_pinned: bool
#     view_count: int
#     images: List[ProductImageResponse]
#     created_at: datetime
#     updated_at: datetime
#     is_updated: bool
    
#     class Config:
#         from_attributes = True

# class ProductListResponse(BaseModel):
#     products: List[ProductResponse]
#     total: int
#     page: int
#     page_size: int
#     total_pages: int


# # Helper functions
# async def validate_images(files: List[UploadFile]) -> List[UploadFile]:
#     if not files or len(files) == 0:
#         raise HTTPException(status_code=400, detail="At least one image is required")
    
#     if len(files) > 10:
#         raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
    
#     for file in files:
#         # Validate MIME type
#         if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"Invalid file type: {file.filename}. Allowed: .jpg, .jpeg, .png, .webp"
#             )
        
#         # Validate file size
#         file.file.seek(0, 2)  # Seek to end
#         size = file.file.tell()
#         file.file.seek(0)  # Reset
        
#         if size > settings.MAX_UPLOAD_SIZE:
#             raise HTTPException(
#                 status_code=400,
#                 detail=f"File too large: {file.filename}. Max size: 5MB"
#             )
    
#     return files


# # Endpoints
# @router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductResponse)
# async def create_product(
#     product_name: str = Form(...),
#     price: float = Form(...),
#     whatsapp_number: str = Form(...),
#     brand_name: Optional[str] = Form(None),
#     address: Optional[str] = Form(None),
#     images: List[UploadFile] = File(...),
#     current_user: User = Depends(require_verified_email),
#     db: AsyncSession = Depends(get_db)
# ):
#     # Validate product data
#     product_data = ProductCreate(
#         product_name=product_name,
#         brand_name=brand_name,
#         price=price,
#         address=address,
#         whatsapp_number=whatsapp_number
#     )
    
#     # Validate images
#     await validate_images(images)
    
#     # Create product
#     product = Product(
#         user_id=current_user.id,
#         product_name=product_data.product_name,
#         brand_name=product_data.brand_name,
#         price=product_data.price,
#         address=product_data.address,
#         whatsapp_number=product_data.whatsapp_number
#     )
    
#     db.add(product)
#     await db.flush()
    
#     # Upload images
#     for idx, image in enumerate(images):
#         image_url, image_key = await upload_image(image, str(product.id))
        
#         product_image = ProductImage(
#             product_id=product.id,
#             image_url=image_url,
#             image_key=image_key,
#             display_order=idx
#         )
#         db.add(product_image)
    
#     await db.commit()
#     await db.refresh(product)
    
#     # Load images
#     result = await db.execute(
#         select(ProductImage).where(ProductImage.product_id == product.id)
#         .order_by(ProductImage.display_order)
#     )
#     product_images = result.scalars().all()
    
#     return ProductResponse(
#         id=str(product.id),
#         user_id=str(product.user_id),
#         product_name=product.product_name,
#         brand_name=product.brand_name,
#         price=float(product.price),
#         address=product.address,
#         whatsapp_number=product.whatsapp_number,
#         is_pinned=product.is_pinned,
#         view_count=product.view_count,
#         images=[
#             ProductImageResponse(
#                 id=str(img.id),
#                 image_url=img.image_url,
#                 display_order=img.display_order
#             )
#             for img in product_images
#         ],
#         created_at=product.created_at,
#         updated_at=product.updated_at or product.created_at,
#         is_updated=False
#         # is_updated=product.updated_at > product.created_at if product.updated_at else False
#     )


# @router.get("/", response_model=ProductListResponse)
# async def list_products(
#     page: int = 1,
#     page_size: int = 20,
#     search: Optional[str] = None,
#     brand: Optional[str] = None,
#     min_price: Optional[float] = None,
#     max_price: Optional[float] = None,
#     db: AsyncSession = Depends(get_db)
# ):
#     # Build query
#     query = select(Product).where(Product.is_active == True)
    
#     if search:
#         query = query.where(
#             or_(
#                 Product.product_name.ilike(f"%{search}%"),
#                 Product.brand_name.ilike(f"%{search}%")
#             )
#         )
    
#     if brand:
#         query = query.where(Product.brand_name.ilike(f"%{brand}%"))
    
#     if min_price is not None:
#         query = query.where(Product.price >= min_price)
    
#     if max_price is not None:
#         query = query.where(Product.price <= max_price)
    
#     # Get total count
#     count_query = select(func.count()).select_from(query.subquery())
#     total_result = await db.execute(count_query)
#     total = total_result.scalar()
    
#     # Order by pinned first, then by created date
#     query = query.order_by(
#         Product.is_pinned.desc(),
#         Product.created_at.desc()
#     )
    
#     # Pagination
#     offset = (page - 1) * page_size
#     query = query.offset(offset).limit(page_size)
    
#     result = await db.execute(query)
#     products = result.scalars().all()
    
#     # Load images for each product
#     product_responses = []
#     for product in products:
#         images_result = await db.execute(
#             select(ProductImage).where(ProductImage.product_id == product.id)
#             .order_by(ProductImage.display_order)
#         )
#         images = images_result.scalars().all()
        
#         product_responses.append(
#             ProductResponse(
#                 id=str(product.id),
#                 user_id=str(product.user_id),
#                 product_name=product.product_name,
#                 brand_name=product.brand_name,
#                 price=float(product.price),
#                 address=product.address,
#                 whatsapp_number=product.whatsapp_number,
#                 is_pinned=product.is_pinned,
#                 view_count=product.view_count,
#                 images=[
#                     ProductImageResponse(
#                         id=str(img.id),
#                         image_url=img.image_url,
#                         display_order=img.display_order
#                     )
#                     for img in images
#                 ],
#                 created_at=product.created_at,
#                 updated_at=product.updated_at,
#                 is_updated=product.updated_at > product.created_at if product.updated_at else False
#             )
#         )
    
#     total_pages = (total + page_size - 1) // page_size
    
#     return ProductListResponse(
#         products=product_responses,
#         total=total,
#         page=page,
#         page_size=page_size,
#         total_pages=total_pages
#     )


# @router.get("/featured", response_model=List[ProductResponse])
# async def get_featured_products(db: AsyncSession = Depends(get_db)):
#     query = select(Product).where(
#         and_(Product.is_active == True, Product.is_pinned == True)
#     ).order_by(Product.created_at.desc()).limit(5)
    
#     result = await db.execute(query)
#     products = result.scalars().all()
    
#     product_responses = []
#     for product in products:
#         images_result = await db.execute(
#             select(ProductImage).where(ProductImage.product_id == product.id)
#             .order_by(ProductImage.display_order)
#         )
#         images = images_result.scalars().all()
        
#         product_responses.append(
#             ProductResponse(
#                 id=str(product.id),
#                 user_id=str(product.user_id),
#                 product_name=product.product_name,
#                 brand_name=product.brand_name,
#                 price=float(product.price),
#                 address=product.address,
#                 whatsapp_number=product.whatsapp_number,
#                 is_pinned=product.is_pinned,
#                 view_count=product.view_count,
#                 images=[
#                     ProductImageResponse(
#                         id=str(img.id),
#                         image_url=img.image_url,
#                         display_order=img.display_order
#                     )
#                     for img in images
#                 ],
#                 created_at=product.created_at,
#                 updated_at=product.updated_at,
#                 is_updated=product.updated_at > product.created_at if product.updated_at else False
#             )
#         )
    
#     return product_responses


# @router.get("/{product_id}", response_model=ProductResponse)
# async def get_product(
#     product_id: str,
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(Product).where(
#             and_(Product.id == uuid.UUID(product_id), Product.is_active == True)
#         )
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     # Increment view count
#     product.view_count += 1
#     await db.commit()
    
#     # Load images
#     images_result = await db.execute(
#         select(ProductImage).where(ProductImage.product_id == product.id)
#         .order_by(ProductImage.display_order)
#     )
#     images = images_result.scalars().all()
    
#     return ProductResponse(
#         id=str(product.id),
#         user_id=str(product.user_id),
#         product_name=product.product_name,
#         brand_name=product.brand_name,
#         price=float(product.price),
#         address=product.address,
#         whatsapp_number=product.whatsapp_number,
#         is_pinned=product.is_pinned,
#         view_count=product.view_count,
#         images=[
#             ProductImageResponse(
#                 id=str(img.id),
#                 image_url=img.image_url,
#                 display_order=img.display_order
#             )
#             for img in images
#         ],
#         created_at=product.created_at,
#         updated_at=product.updated_at,
#         is_updated=product.updated_at > product.created_at if product.updated_at else False
#     )


# @router.put("/{product_id}", response_model=ProductResponse)
# async def update_product(
#     product_id: str,
#     update_data: ProductUpdate,
#     current_user: User = Depends(require_verified_email),
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(Product).where(Product.id == uuid.UUID(product_id))
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     if product.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to edit this product")
    
#     # Update fields
#     for field, value in update_data.dict(exclude_unset=True).items():
#         setattr(product, field, value)
    
#     product.updated_at = datetime.utcnow()
#     await db.commit()
#     await db.refresh(product)
    
#     # Load images
#     images_result = await db.execute(
#         select(ProductImage).where(ProductImage.product_id == product.id)
#         .order_by(ProductImage.display_order)
#     )
#     images = images_result.scalars().all()
    
#     return ProductResponse(
#         id=str(product.id),
#         user_id=str(product.user_id),
#         product_name=product.product_name,
#         brand_name=product.brand_name,
#         price=float(product.price),
#         address=product.address,
#         whatsapp_number=product.whatsapp_number,
#         is_pinned=product.is_pinned,
#         view_count=product.view_count,
#         images=[
#             ProductImageResponse(
#                 id=str(img.id),
#                 image_url=img.image_url,
#                 display_order=img.display_order
#             )
#             for img in images
#         ],
#         created_at=product.created_at,
#         updated_at=product.updated_at,
#         is_updated=True
#     )


# @router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_product(
#     product_id: str,
#     current_user: User = Depends(require_verified_email),
#     db: AsyncSession = Depends(get_db)
# ):
#     result = await db.execute(
#         select(Product).where(Product.id == uuid.UUID(product_id))
#     )
#     product = result.scalar_one_or_none()
    
#     if not product:
#         raise HTTPException(status_code=404, detail="Product not found")
    
#     if product.user_id != current_user.id:
#         raise HTTPException(status_code=403, detail="Not authorized to delete this product")
    
#     # Delete images from storage
#     images_result = await db.execute(
#         select(ProductImage).where(ProductImage.product_id == product.id)
#     )
#     images = images_result.scalars().all()
    
#     for image in images:
#         await delete_image(image.image_key)
    
#     # Delete product (cascade will delete images)
#     await db.delete(product)
#     await db.commit()
    
#     return None