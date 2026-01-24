'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  onSearch?: (params: SearchParams) => void;
}

export interface SearchParams {
  search?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'date_asc' | 'date_desc' | 'views';
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '');
  const [filterOpen, setFilterOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [brand, minPrice, maxPrice, sort].filter(Boolean).length;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();

    const params: SearchParams = {};
    if (search) params.search = search;
    if (brand) params.brand = brand;
    if (minPrice) params.minPrice = parseFloat(minPrice);
    if (maxPrice) params.maxPrice = parseFloat(maxPrice);
    if (sort) params.sort = sort as any;

    // Update URL
    const urlParams = new URLSearchParams();
    if (search) urlParams.set('search', search);
    if (brand) urlParams.set('brand', brand);
    if (minPrice) urlParams.set('minPrice', minPrice);
    if (maxPrice) urlParams.set('maxPrice', maxPrice);
    if (sort) urlParams.set('sort', sort);

    router.push(`/?${urlParams.toString()}`);

    // Call callback if provided
    if (onSearch) {
      onSearch(params);
    }
  };

  const handleClear = () => {
    setSearch('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSort('');
    router.push('/');
    
    if (onSearch) {
      onSearch({});
    }
  };

  const hasActiveFilters = search || brand || minPrice || maxPrice || sort;

  return (
    <div className="w-full space-y-3">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label = "search product"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold">Filter Products</h4>

              {/* Brand Filter */}
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  placeholder="e.g., Apple, Samsung"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range (₦)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    min="0"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sort">Sort By</Label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label='select'
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                >
                  <option value="">Default (Featured First)</option>
                  <option value="date_desc">Newest First</option>
                  <option value="date_asc">Oldest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>

              {/* Apply/Clear Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1"
                  disabled={!hasActiveFilters}
                >
                  Clear All
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleSearch();
                    setFilterOpen(false);
                  }}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button type="submit">
          Search
        </Button>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button
                onClick={() => {
                  setSearch('');
                  handleSearch();
                }}
                aria-label='search filter'
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {brand && (
            <Badge variant="secondary" className="gap-1">
              Brand: {brand}
              <button
                onClick={() => {
                  setBrand('');
                  handleSearch();
                }}
                aria-label='search brand'
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {(minPrice || maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              Price: ₦{minPrice || '0'} - ₦{maxPrice || '∞'}
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                  handleSearch();
                }}
                aria-label='search price'
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {sort && (
            <Badge variant="secondary" className="gap-1">
              Sort: {
                sort === 'price_asc' ? 'Price ↑' :
                sort === 'price_desc' ? 'Price ↓' :
                sort === 'date_asc' ? 'Oldest' :
                sort === 'date_desc' ? 'Newest' :
                sort === 'views' ? 'Most Viewed' : sort
              }
              <button
                onClick={() => {
                  setSort('');
                  handleSearch();
                }}
                aria-label='set sort'
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}