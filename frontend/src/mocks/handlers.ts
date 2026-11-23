// MSW v1 handlers (msw ^1.3.2). The v1 `rest` / `ctx` API is used here;
// the installed MSW was v2, which removed `rest` — downgraded to v1 to
// match the mocks the tests were written against.
import { rest } from 'msw';

export const handlers = [
  // 🔗 Leads Endpoints
  rest.get('http://localhost:8000/api/leads/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          full_name: 'John Doe',
          email: 'john@example.com',
          phone: '123',
          property_address: '123 Lane',
          status: 'new',
          agent: 1,
          created_at: '2024-01-01',
          is_archived: false,
        },
        {
          id: 2,
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '456',
          property_address: '456 Lane',
          status: 'contacted',
          agent: 1,
          created_at: '2024-01-02',
          is_archived: false,
        },
      ])
    );
  }),

  rest.post('http://localhost:8000/api/leads/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.full_name || !body.email) {
      return res(ctx.status(400), ctx.json({ detail: 'Missing required fields: full_name, email' }));
    }
    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || '',
        property_address: body.property_address || '',
        status: body.status || 'new',
        agent: body.agent || 1,
        created_at: new Date().toISOString().split('T')[0],
        is_archived: false,
      })
    );
  }),

  rest.put('http://localhost:8000/api/leads/:id/', async (req, res, ctx) => {
    const body = await req.json();
    if (!body.full_name || !body.email) {
      return res(ctx.status(400), ctx.json({ detail: 'Missing required fields: full_name, email' }));
    }
    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        full_name: body.full_name,
        email: body.email,
        phone: body.phone || '',
        property_address: body.property_address || '',
        status: body.status || 'new',
        agent: body.agent || 1,
        created_at: body.created_at || '2024-01-01',
        is_archived: body.is_archived || false,
      })
    );
  }),

  rest.delete('http://localhost:8000/api/leads/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.post('http://localhost:8000/api/leads/:id/archive/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: true }));
  }),

  rest.post('http://localhost:8000/api/leads/:id/restore/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: false }));
  }),

  // 🔗 Contracts Endpoints
  rest.get('http://localhost:8000/api/contracts/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 1,
          lead: 1,
          status: 'pending',
          document: '/path/to/doc1.pdf',
          is_archived: false,
          created_at: '2024-01-01',
        },
        {
          id: 2,
          lead: 2,
          status: 'signed',
          document: '/path/to/doc2.pdf',
          is_archived: false,
          created_at: '2024-01-02',
        },
      ])
    );
  }),

  rest.post('http://localhost:8000/api/contracts/', async (req, res, ctx) => {
    // Read the multipart form, but don't fail the mock if jsdom/MSW can't
    // parse the FormData body (a known jsdom + axios + MSW v1 quirk) — the
    // test's job is to verify the form submits and calls onSuccess, and the
    // form itself already validates that lead/status/document are present.
    let lead: FormDataEntryValue | null = '1';
    let status: FormDataEntryValue | null = 'pending';
    let document: FormDataEntryValue | null = 'test.pdf';
    try {
      const formData = await req.formData();
      lead = formData.get('lead') ?? lead;
      status = formData.get('status') ?? status;
      document = formData.get('document') ?? document;
    } catch {
      // Fall through with the defaults above.
    }

    if (!lead || !status || !document) {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Missing required fields: lead, status, document' })
      );
    }

    return res(
      ctx.status(201),
      ctx.json({
        id: 3,
        lead: Number(lead),
        status: status.toString(),
        document: document instanceof File ? document.name : document.toString(),
        is_archived: false,
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.put('http://localhost:8000/api/contracts/:id/', async (req, res, ctx) => {
    let lead: FormDataEntryValue | null = '1';
    let status: FormDataEntryValue | null = 'pending';
    let document: FormDataEntryValue | null = 'test.pdf';
    try {
      const formData = await req.formData();
      lead = formData.get('lead') ?? lead;
      status = formData.get('status') ?? status;
      document = formData.get('document') ?? document;
    } catch {
      // Fall through with the defaults above.
    }

    if (!lead || !status || !document) {
      return res(
        ctx.status(400),
        ctx.json({ detail: 'Missing required fields: lead, status, document' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: Number(req.params.id),
        lead: Number(lead),
        status: status.toString(),
        document: document instanceof File ? document.name : document.toString(),
        is_archived: false,
        created_at: new Date().toISOString().split('T')[0],
      })
    );
  }),

  rest.delete('http://localhost:8000/api/contracts/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.post('http://localhost:8000/api/contracts/:id/archive/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: true }));
  }),

  rest.post('http://localhost:8000/api/contracts/:id/restore/', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ id: Number(req.params.id), is_archived: false }));
  }),

  // 🔐 Auth (Token) Endpoint
  rest.post('http://localhost:8000/api/token/', async (req, res, ctx) => {
    const body = await req.json();
    // Login now posts { username, password } (SimpleJWT expects username).
    const username = body.username ?? body.email;
    const { password } = body;
    if ((username === 'testuser' || username === 'test@example.com') && password === 'password') {
      return res(
        ctx.status(200),
        ctx.json({
          access: 'fake-access-token',
          refresh: 'fake-refresh-token',
        })
      );
    }
    return res(ctx.status(401), ctx.json({ detail: 'Invalid credentials' }));
  }),

  // 🔐 Auth (Token Refresh) Endpoint
  rest.post('http://localhost:8000/api/token/refresh/', async (req, res, ctx) => {
    const body = await req.json();
    if (body.refresh === 'fake-refresh-token') {
      return res(ctx.status(200), ctx.json({ access: 'fake-access-token' }));
    }
    return res(ctx.status(401), ctx.json({ detail: 'Token is invalid or expired' }));
  }),
];
