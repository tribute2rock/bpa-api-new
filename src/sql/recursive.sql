with CategoriesCTE (id,name,parentId,[Level]) as (
SELECT id,name,parentId,1
from categories
WHERE parentId is null 

UNION ALL

SELECT categories.id,categories.name,
categories.parentId, categoriesCTE.[Level]+1
from categories
join CategoriesCTE
on categories.parentId = CategoriesCTE.id
)

SELECT CatCTE.name as Category, Isnull(NameCTE.name,'Main Branch') as Branch,CatCTE.[Level]
from categoriesCTE CatCTE
left join categoriesCTE NameCTE
on CatCTE.parentId = NameCTE.id