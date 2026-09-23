import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SimulateInput, simulatorService, slaService, SlaPolicyInput } from '../../services/sla.service';
import { qk } from './keys';

export function useSlaPolicies(enabled = true) {
  return useQuery({ queryKey: qk.slaPolicies, queryFn: slaService.list, enabled });
}

export function useSlaMutations() {
  const qc = useQueryClient();
  const refresh = () => void qc.invalidateQueries({ queryKey: qk.slaPolicies });
  return {
    create: useMutation({ mutationFn: (input: SlaPolicyInput) => slaService.create(input), onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<SlaPolicyInput> & { isActive?: boolean } }) =>
        slaService.update(id, input),
      onSuccess: refresh,
    }),
  };
}

/** Sending a simulated message creates or touches an enquiry, so the inbox lists need a refresh. */
export function useSimulate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SimulateInput) => simulatorService.send(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.enquiries });
      void qc.invalidateQueries({ queryKey: qk.customers });
    },
  });
}
