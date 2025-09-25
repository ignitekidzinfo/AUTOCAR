package com.spring.jwt.serviceImpl;

import com.spring.jwt.dto.DiscountStructureDTO;
import com.spring.jwt.entity.DiscountStructure;
import com.spring.jwt.repository.DiscountStructureRepository;
import com.spring.jwt.service.DiscountService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DiscountServiceImpl implements DiscountService {

    private final DiscountStructureRepository repo;

    @Override
    public void addDiscount(DiscountStructureDTO dto) {
        if (repo.existsByManufacturer(dto.getManufacturer())) {
            throw new IllegalArgumentException(
                    "Discount for manufacturer '" + dto.getManufacturer() + "' already exists");
        }
        repo.save(toEntity(dto));
    }

    @Override
    public Optional<DiscountStructureDTO> getById(Integer id) {
        return repo.findById(id).map(this::toDto);
    }

    @Override
    public List<DiscountStructureDTO> getAll() {
        return repo.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public DiscountStructureDTO updateDiscount(Integer id, DiscountStructureDTO dto) {
        DiscountStructure existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("No discount with id " + id));

        // Update manufacturer only if provided, and enforce uniqueness only in that case
        if (dto.getManufacturer() != null && !dto.getManufacturer().isBlank()) {
            if (!existing.getManufacturer().equals(dto.getManufacturer())
                    && repo.existsByManufacturer(dto.getManufacturer())) {
                throw new IllegalArgumentException(
                        "Discount for manufacturer '" + dto.getManufacturer() + "' already exists");
            }
            existing.setManufacturer(dto.getManufacturer());
        }
        if (dto.getDiscountA() != null) existing.setDiscountA(dto.getDiscountA());
        if (dto.getDiscountB() != null) existing.setDiscountB(dto.getDiscountB());
        if (dto.getDiscountC() != null) existing.setDiscountC(dto.getDiscountC());
        if (dto.getActiveSetIndex() != null) existing.setActiveSetIndex(dto.getActiveSetIndex());
        DiscountStructure saved = repo.save(existing);
        return toDto(saved);
    }

    @Override
    public void deleteDiscount(Integer id) {
        if (!repo.existsById(id)) {
            throw new IllegalArgumentException("No discount with id " + id);
        }
        repo.deleteById(id);
    }

    @Override
    public Optional<DiscountStructureDTO> getByManufacturer(String manufacturer) {
        Optional<DiscountStructure> optionalEntity = repo.findByManufacturerIgnoreCase(manufacturer);
        return optionalEntity.map(this::toDto);
    }

    private DiscountStructure toEntity(DiscountStructureDTO dto) {
        DiscountStructure e = new DiscountStructure();
        e.setManufacturer(dto.getManufacturer());
        e.setDiscountA(dto.getDiscountA());
        e.setDiscountB(dto.getDiscountB());
        e.setDiscountC(dto.getDiscountC());
        e.setActiveSetIndex(dto.getActiveSetIndex());
        return e;
    }

    private DiscountStructureDTO toDto(DiscountStructure e) {
        DiscountStructureDTO dto = new DiscountStructureDTO();
        dto.setDiscountId(e.getDiscountId());
        dto.setManufacturer(e.getManufacturer());
        dto.setDiscountA(e.getDiscountA());
        dto.setDiscountB(e.getDiscountB());
        dto.setDiscountC(e.getDiscountC());
        dto.setActiveSetIndex(e.getActiveSetIndex());
        // also expose the currently active discount as 'discount' for backward compatibility
        Integer active = e.getActiveSetIndex() == null ? 0 : e.getActiveSetIndex();
        Integer value = switch (active) {
            case 1 -> e.getDiscountB();
            case 2 -> e.getDiscountC();
            default -> e.getDiscountA();
        };
        dto.setDiscount(value);
        return dto;
    }


}
