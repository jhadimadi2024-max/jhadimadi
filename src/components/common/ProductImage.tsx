import React, { useState } from 'react';
import { NO_IMAGE_AVAILABLE_ICON, NEUTRAL_PRODUCT_PLACEHOLDER } from '../../constants/imageConstants';
import { getProductPublicUrl } from '../../utils/directSupabaseStorage';

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  photos?: string | string[] | any;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}

/**
 * Robust ProductImage Component:
 * - Dynamically retrieves public URL from Supabase Storage for product.products_photos or product.image.
 * - Parses JSON arrays, stringified JSON, and direct file keys accurately.
 * - Uses a generic neutral product placeholder when image is missing or errors out.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  photos,
  alt = 'পণ্য',
  className = 'w-full h-full object-cover',
  fallbackSrc = NEUTRAL_PRODUCT_PLACEHOLDER,
  ...restProps
}) => {
  const [hasError, setHasError] = useState(false);

  // Derive genuine source using Supabase Storage helper
  const candidate = photos !== undefined && photos !== null && photos !== '' ? photos : src;
  const finalUrl = getProductPublicUrl(candidate);

  const isInvalid = hasError || !finalUrl || finalUrl === NO_IMAGE_AVAILABLE_ICON || finalUrl === NEUTRAL_PRODUCT_PLACEHOLDER;

  if (isInvalid) {
    return (
      <img
        src={fallbackSrc || NEUTRAL_PRODUCT_PLACEHOLDER}
        alt={alt}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer"
        data-product-image="true"
        {...restProps}
        style={{ objectFit: 'cover', ...(restProps.style || {}) }}
      />
    );
  }

  return (
    <img
      src={finalUrl}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      data-product-image="true"
      {...restProps}
      style={{ objectFit: 'cover', ...(restProps.style || {}) }}
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.onerror = null;
        target.src = fallbackSrc || NEUTRAL_PRODUCT_PLACEHOLDER;
        setHasError(true);
      }}
    />
  );
};

export default ProductImage;
