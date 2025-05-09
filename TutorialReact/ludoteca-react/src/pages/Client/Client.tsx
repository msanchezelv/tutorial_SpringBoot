import { useEffect, useState, useContext } from "react";
import Button from "@mui/material/Button";
import TableHead from "@mui/material/TableHead";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import EditIcon from "@mui/icons-material/Edit";
import ClearIcon from "@mui/icons-material/Clear";
import styles from "./Client.module.css";
import CreateClient from "./components/CreateClient";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { useAppDispatch } from "../../redux/hooks";
import { setMessage } from "../../redux/features/messageSlice";
import { BackError } from "../../types/appTypes";
import { Client as ClientModel } from "../../types/Client";
import {
  useDeleteClientMutation,
  useGetClientsQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
} from "../../redux/services/ludotecaApi";
import { LoaderContext } from "../../context/LoaderProvider";

export const Client = () => {
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [clients, setClients] = useState<ClientModel[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [idToDelete, setIdToDelete] = useState("");
  const [clientToUpdate, setClientToUpdate] = useState<ClientModel | null>(
    null
  );

  const dispatch = useAppDispatch();
  const loader = useContext(LoaderContext);

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPageNumber(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setPageNumber(0);
    setPageSize(parseInt(event.target.value, 10));
  };

  const { data, error, isLoading } = useGetClientsQuery({
    pageNumber,
    pageSize,
  });

  const [deleteClientApi, { isLoading: isLoadingDelete, error: errorDelete }] =
    useDeleteClientMutation();

  const [createClientApi, { isLoading: isLoadingCreate }] =
    useCreateClientMutation();

  const [updateClientApi, { isLoading: isLoadingUpdate }] =
    useUpdateClientMutation();

  useEffect(() => {
    loader.showLoading(
      isLoadingCreate || isLoading || isLoadingDelete || isLoadingUpdate
    );
  }, [isLoadingCreate, isLoading, isLoadingDelete, isLoadingUpdate]);

  useEffect(() => {
    if (data) {
      setClients(data.content);
      setTotal(data.totalElements);
    }
  }, [data]);

  useEffect(() => {
    if (errorDelete) {
      if ("status" in errorDelete) {
        dispatch(
          setMessage({
            text: (errorDelete?.data as BackError).msg,
            type: "error",
          })
        );
      }
    }
  }, [errorDelete, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(setMessage({ text: "Se ha producido un error", type: "error" }));
    }
  }, [error]);

  const createClient = (client: ClientModel) => {
    setOpenCreate(false);
    if (client.id) {
      updateClientApi(client)
        .then(() => {
          dispatch(
            setMessage({
              text: "Cliente actualizado correctamente",
              type: "ok",
            })
          );
          setClientToUpdate(null);
        })
        .catch((err) => console.log(err));
    } else {
      createClientApi(client)
        .then(() => {
          dispatch(
            setMessage({ text: "Cliente creado correctamente", type: "ok" })
          );
          setClientToUpdate(null);
        })
        .catch((err) => console.log(err));
    }
  };

  const deleteClient = () => {
    deleteClientApi(idToDelete)
      .then(() => {
        setIdToDelete("");
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className="container">
      <h1>Listado de Clientes</h1>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 500 }} aria-label="custom pagination table">
          <TableHead
            sx={{
              "& th": {
                backgroundColor: "lightgrey",
              },
            }}
          >
            <TableRow>
              <TableCell>Identificador</TableCell>
              <TableCell>Nombre Cliente</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client: ClientModel) => (
              <TableRow key={client.id}>
                <TableCell component="th" scope="row">
                  {client.id}
                </TableCell>
                <TableCell style={{ width: 160 }}>{client.name}</TableCell>
                <TableCell align="right">
                  <div className={styles.tableActions}>
                    <IconButton
                      aria-label="update"
                      color="primary"
                      onClick={() => {
                        setClientToUpdate(client);
                        setOpenCreate(true);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => {
                        setIdToDelete(client.id);
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                colSpan={4}
                count={total}
                rowsPerPage={pageSize}
                page={pageNumber}
                SelectProps={{
                  inputProps: {
                    "aria-label": "rows per page",
                  },
                  native: true,
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <div className="newButton">
        <Button variant="contained" onClick={() => setOpenCreate(true)}>
          Nuevo cliente
        </Button>
      </div>
      {openCreate && (
        <CreateClient
          create={createClient}
          client={clientToUpdate}
          closeModal={() => {
            setClientToUpdate(null);
            setOpenCreate(false);
          }}
        />
      )}
      {!!idToDelete && (
        <ConfirmDialog
          title="Eliminar cliente"
          text="Atención si borra el cliente se perderán sus datos. ¿Desea eliminar el cliente?"
          confirm={deleteClient}
          closeModal={() => setIdToDelete("")}
        />
      )}
    </div>
  );
};