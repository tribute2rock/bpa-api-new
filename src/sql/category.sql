select distinct categories.* from categories join forms on forms.categoryId = categories.id where forms.availableFor = 'internal' and otherServices = 0;