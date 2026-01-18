# backend/app/services/storage.py
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
import uuid
from typing import Tuple

from app.core.config import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

async def upload_image(file: UploadFile, product_id: str) -> Tuple[str, str]:
    """
    Upload image to S3 and return (URL, key)
    """
    # Generate unique filename
    file_ext = file.filename.split('.')[-1]
    file_key = f"products/{product_id}/{uuid.uuid4()}.{file_ext}"
    
    try:
        # Upload to S3
        s3_client.upload_fileobj(
            file.file,
            settings.S3_BUCKET,
            file_key,
            ExtraArgs={
                'ContentType': file.content_type,
                'ACL': 'public-read'
            }
        )
        
        # Generate URL
        if settings.CLOUDFRONT_URL:
            url = f"{settings.CLOUDFRONT_URL}/{file_key}"
        else:
            url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
        
        return url, file_key
    
    except ClientError as e:
        raise Exception(f"Failed to upload image: {str(e)}")


async def delete_image(image_key: str) -> bool:
    """
    Delete image from S3
    """
    try:
        s3_client.delete_object(
            Bucket=settings.S3_BUCKET,
            Key=image_key
        )
        return True
    except ClientError as e:
        print(f"Failed to delete image: {str(e)}")
        return False
