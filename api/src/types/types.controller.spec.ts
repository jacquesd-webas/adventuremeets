import { TypesController } from "./types.controller";
import { TypesService } from "./types.service";

describe("TypesController", () => {
  let controller: TypesController;

  const typesService = {
    listMeetStatuses: jest.fn(),
    listRoles: jest.fn(),
  } as unknown as TypesService;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new TypesController(typesService);
  });

  it("lists meet statuses", async () => {
    (typesService.listMeetStatuses as jest.Mock).mockResolvedValue([
      { id: 1, name: "Draft" },
      { id: 2, name: "Published" },
    ]);

    await expect(controller.listMeetStatuses()).resolves.toEqual({
      meetStatuses: [
        { id: 1, name: "Draft" },
        { id: 2, name: "Published" },
      ],
    });
    expect(typesService.listMeetStatuses).toHaveBeenCalledTimes(1);
  });

  it("lists roles", async () => {
    (typesService.listRoles as jest.Mock).mockResolvedValue([
      { id: 1, name: "admin" },
      { id: 2, name: "organizer" },
      { id: 3, name: "member" },
    ]);

    await expect(controller.listRoles()).resolves.toEqual({
      roles: [
        { id: 1, name: "admin" },
        { id: 2, name: "organizer" },
        { id: 3, name: "member" },
      ],
    });
    expect(typesService.listRoles).toHaveBeenCalledTimes(1);
  });
});
