import { BUSY_MESSAGE, isSerializationFailure, withSerializableRetry } from '../lib/serializableRetry';

const conflict = () => Object.assign(new Error('Transaction failed due to a write conflict or a deadlock. Please retry'), { code: 'P2034' });

describe('withSerializableRetry', () => {
  it('repete a transação abortada por conflito e devolve o resultado', async () => {
    const run = jest.fn().mockRejectedValueOnce(conflict()).mockRejectedValueOnce(conflict()).mockResolvedValue('ok');
    await expect(withSerializableRetry(run)).resolves.toBe('ok');
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('não repete erro de regra de negócio', async () => {
    const run = jest.fn().mockRejectedValue(new Error('Estoque insuficiente'));
    await expect(withSerializableRetry(run)).rejects.toThrow('Estoque insuficiente');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('desiste após o limite com mensagem amigável, sem detalhes do banco', async () => {
    const run = jest.fn().mockRejectedValue(conflict());
    await expect(withSerializableRetry(run, { attempts: 2 })).rejects.toThrow(BUSY_MESSAGE);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('só repete violação de unicidade quando pedido', () => {
    const unique = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
    expect(isSerializationFailure(unique)).toBe(false);
    expect(isSerializationFailure(unique, true)).toBe(true);
  });
});
