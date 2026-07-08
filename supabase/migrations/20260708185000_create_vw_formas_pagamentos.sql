CREATE OR REPLACE VIEW public.vw_formas_pagamentos AS
SELECT
  w.id,
  w.name,
  w.client,
  w.client_cpf,
  w.client_email,
  w.client_phone,
  w.consultant_id,
  w.pre_processual_agent_id,
  w.service_type,
  w.start_date,
  w.end_date_planned,
  w.contracted_value,
  w.entry_value,
  w.payment_method,
  w.entry_payment_method,
  w.installments,
  w.status,
  w.is_entry_paid,
  w.cancellation_date,
  w.cancellation_reason,
  w.internal_failure,
  w.created_at,
  w.manager,
  w.address,
  w.budget_planned,
  w.progress_percentage,
  w.notes,
  w.total_area
FROM public.works w;

ALTER VIEW public.vw_formas_pagamentos SET (security_invoker = true);

GRANT SELECT ON public.vw_formas_pagamentos TO authenticated;
