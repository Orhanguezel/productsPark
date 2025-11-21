// =============================================================
// FILE: src/pages/public/components/ProductInfoSection.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Sparkles,
  ExternalLink,
  Check,
} from "lucide-react";

import { formatPrice } from "@/lib/utils";

import type {
  Product,
  QuantityOption,
} from "./productDetail.types";

interface ProductInfoSectionProps {
  product: Product;
  quantity: number;
  onIncreaseQuantity: () => void;
  onDecreaseQuantity: () => void;
  selectedQuantityOption: QuantityOption | null;
  onSelectQuantityOption: (opt: QuantityOption | null) => void;
  customFieldValues: Record<string, string>;
  onCustomFieldValuesChange: (values: Record<string, string>) => void;
  onQuickBuy: () => void;
  onAddToCart: () => void;
  onWhatsAppPurchase: () => void;
  onOpenDemoModal: () => void;
}

const ProductInfoSection = ({
  product,
  quantity,
  onIncreaseQuantity,
  onDecreaseQuantity,
  selectedQuantityOption,
  onSelectQuantityOption,
  customFieldValues,
  onCustomFieldValuesChange,
  onQuickBuy,
  onAddToCart,
  onWhatsAppPurchase,
  onOpenDemoModal,
}: ProductInfoSectionProps) => {
  const handleFieldChange = (fieldId: string, value: string, type: string) => {
    if (type === "phone" && value.length > 15) return;
    if (type === "text" && value.length > 130) return;
    onCustomFieldValuesChange({
      ...customFieldValues,
      [fieldId]: value,
    });
  };

  const effectiveUnitPrice = selectedQuantityOption
    ? selectedQuantityOption.price
    : product.price;

  return (
    <div className="space-y-6">
      {/* Başlık + Rating */}
      <div>
        <p className="text-sm text-muted-foreground mb-2">
          {product.categories?.name}
        </p>
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < product.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                  }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            ({product.review_count} Satış)
          </span>
        </div>
      </div>

      <Separator />

      {/* Fiyat */}
      <div className="space-y-2">
        {product.original_price && (
          <p className="text-lg text-muted-foreground line-through">
            {formatPrice(product.original_price)}
          </p>
        )}
        <p className="text-4xl font-bold text-primary">
          {formatPrice(effectiveUnitPrice)}
        </p>
        {product.original_price && (
          <Badge variant="secondary" className="text-sm">
            %
            {Math.round(
              ((product.original_price - product.price) /
                product.original_price) *
              100
            )}{" "}
            İndirim
          </Badge>
        )}
      </div>

      <Separator />

      {/* Adet Seçimi */}
      {product.quantity_options && product.quantity_options.length > 0 ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Adet Seçiniz *</label>
          <Select
            value={
              selectedQuantityOption
                ? `${selectedQuantityOption.quantity}-${selectedQuantityOption.price}`
                : ""
            }
            onValueChange={(value) => {
              const [qty, price] = value.split("-").map(Number);
              onSelectQuantityOption({ quantity: qty, price });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Adet seçiniz" />
            </SelectTrigger>
            <SelectContent>
              {product.quantity_options.map((option, idx) => (
                <SelectItem
                  key={idx}
                  value={`${option.quantity}-${option.price}`}
                >
                  {option.quantity} Adet - {formatPrice(option.price)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : product.delivery_type !== "api" ? (
        <div className="space-y-2">
          <label className="text-sm font-medium">Adet</label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onDecreaseQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-2xl font-semibold w-12 text-center">
              {quantity}
            </span>
            <Button variant="outline" size="icon" onClick={onIncreaseQuantity}>
              <Plus className="w-4 h-4" />
            </Button>
            <div className="ml-auto">
              <p className="text-sm text-muted-foreground">Toplam</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(product.price * quantity)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <Separator />

      {/* Custom Fields */}
      {product.custom_fields && product.custom_fields.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Ürün Bilgileri</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {product.custom_fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                {field.type !== "textarea" ? (
                  <Input
                    id={field.id}
                    type={field.type === "phone" ? "tel" : field.type}
                    placeholder={field.placeholder}
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) =>
                      handleFieldChange(field.id, e.target.value, field.type)
                    }
                    required={field.required}
                    maxLength={
                      field.type === "text"
                        ? 130
                        : field.type === "phone"
                          ? 15
                          : undefined
                    }
                  />
                ) : (
                  <Textarea
                    id={field.id}
                    placeholder={field.placeholder}
                    value={customFieldValues[field.id] || ""}
                    onChange={(e) =>
                      handleFieldChange(field.id, e.target.value, field.type)
                    }
                    required={field.required}
                    maxLength={130}
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Demo Kartı */}
      {product.demo_url && (
        <Card className="bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-semibold">Canlı Demo Mevcut</p>
                  <p className="text-sm text-muted-foreground">
                    Satın almadan önce deneyin
                  </p>
                </div>
              </div>
              <Button
                size="lg"
                variant="default"
                className="gradient-primary"
                onClick={() => {
                  if (product.demo_embed_enabled) {
                    onOpenDemoModal();
                  } else {
                    window.open(product.demo_url!, "_blank");
                  }
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {product.demo_button_text || "Demoyu İncele"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          size="lg"
          className="w-full gradient-primary text-lg"
          onClick={onQuickBuy}
        >
          <Zap className="w-5 h-5 mr-2" />
          Hızlı Satın Al
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full text-lg"
          onClick={onAddToCart}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Sepete Ekle
        </Button>
        <Button
          size="lg"
          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-lg"
          onClick={onWhatsAppPurchase}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp ile Satın Al
        </Button>
      </div>

      {/* Features */}
      {product.features && product.features.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              {product.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductInfoSection;
