select *
from (
         select *, row_number() over (partition by role order by totalTask desc) rn
         from (select u.userId usr, u.roleId role, count(*) totalTask
               from (
                        select ru.roleId, wm.userId
                        from workflow_masters wm
                                 join role_users ru on wm.userId = ru.userId
                    ) u
               group by userid, roleId) as uIrItT
     ) as [*2]
where rn = 1 and role = 2
