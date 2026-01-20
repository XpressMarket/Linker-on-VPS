# backend/app/services/storage.py

from fastapi import UploadFile
from typing import Tuple
import os
import uuid
from pathlib import Path

from app.core.config import settings

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def upload_image(file: UploadFile, product_id: str) -> Tuple[str, str]:
    """
    Upload image to local storage (temporary - will use S3 in production)
    """
    # Generate unique filename
    file_ext = file.filename.split('.')[-1]
    file_key = f"products/{product_id}/{uuid.uuid4()}.{file_ext}"
    
    # Save to local uploads folder
    file_path = UPLOAD_DIR / file_key.replace('/', '_')
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write file
    content = await file.read()
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Reset file pointer
    await file.seek(0)
    
    # Return URL (for now, just the filename - we'll serve it later)
    url = f"http://127.0.0.1:8000/uploads/{file_key.replace('/', '_')}"
    
    print(f"📁 Image saved locally: {file_path}")
    
    return url, file_key


async def delete_image(image_key: str) -> bool:
    """
    Delete image from local storage
    """
    try:
        file_path = UPLOAD_DIR / image_key.replace('/', '_')
        if file_path.exists():
            file_path.unlink()
            print(f"🗑️ Image deleted: {file_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to delete image: {str(e)}")
        return False






# backend/app/services/storage.py





# import boto3
# from botocore.exceptions import ClientError
# from fastapi import UploadFile
# import uuid
# from typing import Tuple

# from app.core.config import settings

# s3_client = boto3.client(
#     's3',
#     aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
#     aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
#     region_name=settings.AWS_REGION
# )

# async def upload_image(file: UploadFile, product_id: str) -> Tuple[str, str]:
#     """
#     Upload image to S3 and return (URL, key)
#     """
#     # Generate unique filename
#     file_ext = file.filename.split('.')[-1]
#     file_key = f"products/{product_id}/{uuid.uuid4()}.{file_ext}"
    
#     try:
#         # Upload to S3
#         s3_client.upload_fileobj(
#             file.file,
#             settings.S3_BUCKET,
#             file_key,
#             ExtraArgs={
#                 'ContentType': file.content_type,
#                 'ACL': 'public-read'
#             }
#         )
        
#         # Generate URL
#         if settings.CLOUDFRONT_URL:
#             url = f"{settings.CLOUDFRONT_URL}/{file_key}"
#         else:
#             url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
        
#         return url, file_key
    
#     except ClientError as e:
#         raise Exception(f"Failed to upload image: {str(e)}")


# async def delete_image(image_key: str) -> bool:
#     """
#     Delete image from S3
#     """
#     try:
#         s3_client.delete_object(
#             Bucket=settings.S3_BUCKET,
#             Key=image_key
#         )
#         return True
#     except ClientError as e:
#         print(f"Failed to delete image: {str(e)}")
#         return False
