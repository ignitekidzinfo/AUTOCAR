package com.spring.jwt.controller;

import com.spring.jwt.dto.DiscountStructureDTO;
import com.spring.jwt.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/discounts")
@RequiredArgsConstructor
public class DiscountStructureController {

    private final DiscountService discountService;

    @PostMapping("/add")
    public ResponseEntity<?> add(@RequestBody DiscountStructureDTO dto) {
        discountService.addDiscount(dto);
        return ResponseEntity.ok("Added Successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Integer id) {
        return discountService.getById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    public ResponseEntity<List<DiscountStructureDTO>> getAll() {
        return ResponseEntity.ok(discountService.getAll());
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> patch(
            @PathVariable Integer id,
            @RequestBody DiscountStructureDTO dto) {
        try {
            DiscountStructureDTO updated = discountService.updateDiscount(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id) {
        try {
            discountService.deleteDiscount(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/by-manufacturer/{manufacturer}")
    public ResponseEntity<DiscountStructureDTO> getDiscountByManufacturer(@PathVariable String manufacturer) {
        return discountService.getByManufacturer(manufacturer)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Update active set index for a manufacturer
    @PatchMapping("/active-set/{id}/{index}")
    public ResponseEntity<?> updateActiveSet(
            @PathVariable Integer id,
            @PathVariable Integer index) {
        try {
            DiscountStructureDTO dto = new DiscountStructureDTO();
            dto.setActiveSetIndex(index);
            DiscountStructureDTO updated = discountService.updateDiscount(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Optional: update active set by manufacturer name directly
    @PatchMapping("/active-set/by-manufacturer/{manufacturer}/{index}")
    public ResponseEntity<?> updateActiveSetByManufacturer(
            @PathVariable String manufacturer,
            @PathVariable Integer index) {
        return discountService.getByManufacturer(manufacturer)
                .map(dto -> {
                    DiscountStructureDTO payload = new DiscountStructureDTO();
                    payload.setActiveSetIndex(index);
                    DiscountStructureDTO updated = discountService.updateDiscount(dto.getDiscountId(), payload);
                    return ResponseEntity.ok(updated);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
